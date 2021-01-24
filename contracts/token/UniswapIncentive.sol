pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/utils/SafeCast.sol";
import "@openzeppelin/contracts/math/Math.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "./IUniswapIncentive.sol";
import "../utils/SafeMath32.sol";
import "../refs/UniRef.sol";
import "../oracle/IOracle.sol";

/// @title IUniswapIncentive implementation
/// @author Fei Protocol
contract UniswapIncentive is IUniswapIncentive, UniRef {
	using Decimal for Decimal.D256;
    using SafeMath32 for uint32;
    using SafeMath for uint;
    using SafeCast for uint;

    struct TimeWeightInfo {
        uint32 blockNo;
        uint32 weight;
        uint32 growthRate;
        bool active;
    }

    TimeWeightInfo private timeWeightInfo;

    uint32 public constant override TIME_WEIGHT_GRANULARITY = 100_000;

    mapping(address => bool) private _exempt;
    mapping(address => bool) private _allowlist;

    /// @notice UniswapIncentive constructor
    /// @param _core Fei Core to reference
    /// @param _oracle Oracle to reference
    /// @param _pair Uniswap Pair to incentivize
    /// @param _router Uniswap Router
	constructor(
        address _core, 
        address _oracle, 
        address _pair, 
        address _router,
        uint32 _growthRate
    ) public UniRef(_core, _pair, _router, _oracle) {
        _setTimeWeight(0, _growthRate, false);    
    }

    function incentivize(
    	address sender, 
    	address receiver, 
    	address operator, 
    	uint amountIn
    ) external override onlyFei {
        updateOracle();

    	if (isPair(sender)) {
    		incentivizeBuy(receiver, amountIn);
    	}

    	if (isPair(receiver)) {
            require(isSellAllowlisted(sender) || isSellAllowlisted(operator), "UniswapIncentive: Blocked Fei sender or operator");
    		incentivizeSell(sender, amountIn);
    	}
    }

    function setExemptAddress(address account, bool isExempt) external override onlyGovernor {
    	_exempt[account] = isExempt;
        emit ExemptAddressUpdate(account, isExempt);
    }

    function setSellAllowlisted(address account, bool isAllowed) external override onlyGovernor {
        _allowlist[account] = isAllowed;
        emit SellAllowedAddressUpdate(account, isAllowed);
    }

    function setTimeWeightGrowth(uint32 growthRate) external override onlyGovernor {
        TimeWeightInfo memory tw = timeWeightInfo;
        timeWeightInfo = TimeWeightInfo(tw.blockNo, tw.weight, growthRate, tw.active);
        emit GrowthRateUpdate(growthRate);
    }

    function setTimeWeight(uint32 weight, uint32 growth, bool active) external override onlyGovernor {
        _setTimeWeight(weight, growth, active);
        // TimeWeightInfo memory tw = timeWeightInfo;
        // timeWeightInfo = TimeWeightInfo(blockNo, tw.weight, tw.growthRate, tw.active);
    }

    function getGrowthRate() public view override returns (uint32) {
        return timeWeightInfo.growthRate;
    }

    function getTimeWeight() public view override returns (uint32) {
        TimeWeightInfo memory tw = timeWeightInfo;
        if (!tw.active) {
            return 0;
        }

        uint32 blockDelta = block.number.toUint32().sub(tw.blockNo);
        return tw.weight.add(blockDelta * tw.growthRate);
    }

    function isTimeWeightActive() public view override returns (bool) {
    	return timeWeightInfo.active;
    }

    function isExemptAddress(address account) public view override returns (bool) {
    	return _exempt[account];
    }

    function isSellAllowlisted(address account) public view override returns(bool) {
        return _allowlist[account];
    }

    function isIncentiveParity() public view override returns (bool) {
        uint32 weight = getTimeWeight();
        require(weight != 0, "UniswapIncentive: Incentive zero or not active");

        (Decimal.D256 memory price,,) = getUniswapPrice();
        Decimal.D256 memory deviation = calculateDeviation(price, peg());
        require(!deviation.equals(Decimal.zero()), "UniswapIncentive: Price already at or above peg");

        Decimal.D256 memory incentive = calculateBuyIncentiveMultiplier(deviation, weight);
        Decimal.D256 memory penalty = calculateSellPenaltyMultiplier(deviation);
        return incentive.equals(penalty);
    }

    function getBuyIncentive(uint amount) public view override returns(
        uint incentive, 
        uint32 weight,
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    ) {
        (initialDeviation, finalDeviation) = getPriceDeviations(-1 * int256(amount));
        weight = getTimeWeight();

        if (initialDeviation.equals(Decimal.zero())) {
            return (0, weight, initialDeviation, finalDeviation);
        }

        uint incentivizedAmount = amount;
        if (finalDeviation.equals(Decimal.zero())) {
            incentivizedAmount = getAmountToPegFei();
        }

        Decimal.D256 memory multiplier = calculateBuyIncentiveMultiplier(initialDeviation, weight);
        incentive = multiplier.mul(incentivizedAmount).asUint256();
        return (incentive, weight, initialDeviation, finalDeviation);
    }

    function getSellPenalty(uint amount) public view override returns(
        uint penalty, 
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    ) {
        (initialDeviation, finalDeviation) = getPriceDeviations(int256(amount));

        if (finalDeviation.equals(Decimal.zero())) {
            return (0, initialDeviation, finalDeviation);
        }

        uint incentivizedAmount = amount;
        if (initialDeviation.equals(Decimal.zero())) {
            uint amountToPeg = getAmountToPegFei();
            incentivizedAmount = amount.sub(amountToPeg, "UniswapIncentive: Underflow");
        }

        Decimal.D256 memory multiplier = calculateSellPenaltyMultiplier(finalDeviation); 
        penalty = multiplier.mul(incentivizedAmount).asUint256(); 
        return (penalty, initialDeviation, finalDeviation);   
    }

    function incentivizeBuy(address target, uint amountIn) internal ifMinterSelf {
    	if (isExemptAddress(target)) {
    		return;
    	}

        (uint incentive, uint32 weight,
        Decimal.D256 memory initialDeviation, 
        Decimal.D256 memory finalDeviation) = getBuyIncentive(amountIn);

        updateTimeWeight(initialDeviation, finalDeviation, weight);
        if (incentive != 0) {
            fei().mint(target, incentive);         
        }
    }

    function incentivizeSell(address target, uint amount) internal ifBurnerSelf {
    	if (isExemptAddress(target)) {
    		return;
    	}

        (uint penalty, Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation) = getSellPenalty(amount);

        uint32 weight = getTimeWeight();
        updateTimeWeight(initialDeviation, finalDeviation, weight);

        if (penalty != 0) {
            fei().burnFrom(target, penalty);
        }
    }

    function calculateBuyIncentiveMultiplier(
        Decimal.D256 memory deviation,
        uint32 weight
    ) internal pure returns (Decimal.D256 memory) {
        Decimal.D256 memory correspondingPenalty = calculateSellPenaltyMultiplier(deviation);
        Decimal.D256 memory buyMultiplier = deviation.mul(uint(weight)).div(uint(TIME_WEIGHT_GRANULARITY));
        
        if (correspondingPenalty.lessThan(buyMultiplier)) {
            return correspondingPenalty;
        }
        
        return buyMultiplier;
    }

    function calculateSellPenaltyMultiplier(
        Decimal.D256 memory deviation
    ) internal pure returns (Decimal.D256 memory) {
        return deviation.mul(deviation).mul(100); // m^2 * 100
    }

    function updateTimeWeight (
        Decimal.D256 memory initialDeviation, 
        Decimal.D256 memory finalDeviation, 
        uint32 currentWeight
    ) internal {
        // Reset after completion
        if (finalDeviation.equals(Decimal.zero())) {
            _setTimeWeight(0, getGrowthRate(), false);
            return;
        } 
        // Init
        if (initialDeviation.equals(Decimal.zero())) {
            _setTimeWeight(0, getGrowthRate(), true);
            return;
        }

        uint updatedWeight = uint(currentWeight);
        // Partial buy
        if (initialDeviation.greaterThan(finalDeviation)) {
            Decimal.D256 memory remainingRatio = finalDeviation.div(initialDeviation);
            updatedWeight = remainingRatio.mul(uint(currentWeight)).asUint256();
        }
        
        uint maxWeight = finalDeviation.mul(100).mul(uint(TIME_WEIGHT_GRANULARITY)).asUint256(); // m^2*100 (sell) = t*m (buy) 
        updatedWeight = Math.min(updatedWeight, maxWeight);
        _setTimeWeight(updatedWeight.toUint32(), getGrowthRate(), true);
    }

    function _setTimeWeight(uint32 weight, uint32 growthRate, bool active) internal {
        uint32 currentGrowth = getGrowthRate();

        uint32 blockNo = block.number.toUint32();

        timeWeightInfo = TimeWeightInfo(blockNo, weight, growthRate, active);

        emit TimeWeightUpdate(weight, active);   
        if (currentGrowth != growthRate) {
            emit GrowthRateUpdate(growthRate);
        }
    }
}