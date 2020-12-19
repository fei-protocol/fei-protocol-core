pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IUniswapIncentive.sol";
import "../external/Decimal.sol";
import "../oracle/IOracle.sol";
import "../refs/UniRef.sol";
import "../external/SafeMath32.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract UniswapIncentive is IUniswapIncentive, UniRef {
	using Decimal for Decimal.D256;
    using SafeMath32 for uint32;

    struct TimeWeightInfo {
        uint32 blockNo;
        uint32 weight;
        uint32 growthRate;
        bool active;
    }

    TimeWeightInfo public timeWeightInfo;

    uint32 public constant TIME_WEIGHT_GRANULARITY = 100_000;
    uint32 public constant DEFAULT_INCENTIVE_GROWTH_RATE = 333; // about 1 unit per hour assuming 12s block time

    mapping(address => bool) private _exempt;

    event TimeWeightUpdate(uint _weight, bool _active);
    event GrowthRateUpdate(uint _growthRate);
    event ExemptAddressUpdate(address indexed _account, bool _isExempt);

	constructor(address core, address _oracle, address _pair, address _router) public
	UniRef(core, _pair, _router, _oracle) {
        _setTimeWeight(0, false);    
    }

    function incentivize(
    	address sender, 
    	address receiver, 
    	address, 
    	uint256 amountIn
    ) external override onlyFei {
        updateOracle();
    	if (isPair(sender)) {
    		incentivizeBuy(receiver, amountIn);
    	}

    	if (isPair(receiver)) {
    		incentivizeSell(sender, amountIn);
    	}
    }

    function setExemptAddress(address account, bool isExempt) public override onlyGovernor {
    	_exempt[account] = isExempt;
        emit ExemptAddressUpdate(account, isExempt);
    }

    function setTimeWeightGrowth(uint32 growthRate) public onlyGovernor {
        TimeWeightInfo memory tw = timeWeightInfo;
        timeWeightInfo = TimeWeightInfo(tw.blockNo, tw.weight, growthRate, tw.active);
        emit GrowthRateUpdate(growthRate);
    }

    function setTimeWeight(uint32 blockNo, uint32 weight, uint32 growth, bool active) public onlyGovernor {
        uint32 currentGrowth = getGrowthRate();
        timeWeightInfo = TimeWeightInfo(blockNo, weight, growth, active);
        emit TimeWeightUpdate(weight, active);
        if (currentGrowth != growth) {
            emit GrowthRateUpdate(growth);
        }
    }

    function getGrowthRate() public view returns (uint32) {
        uint32 growth = timeWeightInfo.growthRate;
        if (growth == 0) {
            return DEFAULT_INCENTIVE_GROWTH_RATE;
        }
        return growth;
    }

    function getTimeWeight() public view returns (uint32) {
        TimeWeightInfo memory tw = timeWeightInfo;
        if (!tw.active) {
            return 0;
        }
        uint32 blockDelta = SafeMath32.safe32(block.number).sub(tw.blockNo);
        return tw.weight.add(blockDelta * tw.growthRate);
    }

    function isExemptAddress(address account) public view returns (bool) {
    	return _exempt[account];
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

    function getBuyIncentive(uint256 amount) public view returns(
        uint256 incentive, 
        uint32 weight,
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    ) {
        (initialDeviation, finalDeviation) = getPriceDeviations(-1 * int256(amount));
        weight = getTimeWeight();
        if (initialDeviation.equals(Decimal.zero())) {
            return (0, weight, initialDeviation, finalDeviation);
        }

        uint256 incentivizedAmount = amount;
        if (finalDeviation.equals(Decimal.zero())) {
            incentivizedAmount = getAmountToPegFei();
        }

        Decimal.D256 memory multiplier = calculateBuyIncentiveMultiplier(initialDeviation, weight);
        incentive = multiplier.mul(incentivizedAmount).asUint256();
        return (incentive, weight, initialDeviation, finalDeviation);
    }

    function getSellPenalty(uint256 amount) public view returns(
        uint256 penalty, 
        Decimal.D256 memory initialDeviation,
        Decimal.D256 memory finalDeviation
    ) {
        (initialDeviation, finalDeviation) = getPriceDeviations(int256(amount));

        if (finalDeviation.equals(Decimal.zero())) {
            return (0, initialDeviation, finalDeviation);
        }

        uint256 incentivizedAmount = amount;
        if (initialDeviation.equals(Decimal.zero())) {
            uint256 amountToPeg = getAmountToPegFei();
            require(amount >= amountToPeg, "UniswapIncentive: Underflow");
            incentivizedAmount = amount - amountToPeg;
        }
        Decimal.D256 memory multiplier = calculateSellPenaltyMultiplier(finalDeviation); 
        penalty = multiplier.mul(incentivizedAmount).asUint256(); 
        return (penalty, initialDeviation, finalDeviation);   
    }

    function incentivizeBuy(address target, uint256 amountIn) internal ifMinterSelf {
    	if (isExemptAddress(target)) {
    		return;
    	}

        (uint256 incentive, uint32 weight,
        Decimal.D256 memory initialDeviation, 
        Decimal.D256 memory finalDeviation) = getBuyIncentive(amountIn);

        updateTimeWeight(initialDeviation, finalDeviation, weight);
        if (incentive != 0) {
            fei().mint(target, incentive);         
        }
    }

    function incentivizeSell(address target, uint256 amount) internal ifBurnerSelf {
    	if (isExemptAddress(target)) {
    		return;
    	}

        (uint256 penalty, Decimal.D256 memory initialDeviation,
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
        Decimal.D256 memory buyMultiplier = deviation.mul(uint256(weight)).div(uint256(TIME_WEIGHT_GRANULARITY));
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
            _setTimeWeight(0, false);
            return;
        } 
        // Init
        if (initialDeviation.equals(Decimal.zero())) {
            _setTimeWeight(0, true);
            return;
        }

        uint256 updatedWeight = uint256(currentWeight);
        // Partial buy
        if (initialDeviation.greaterThan(finalDeviation)) {
            Decimal.D256 memory remainingRatio = finalDeviation.div(initialDeviation);
            updatedWeight = remainingRatio.mul(uint256(currentWeight)).asUint256();
        }
        uint256 maxWeight = finalDeviation.mul(100).mul(uint256(TIME_WEIGHT_GRANULARITY)).asUint256(); // m^2*100 (sell) = t*m (buy) 
        updatedWeight = Math.min(updatedWeight, maxWeight);
        _setTimeWeight(SafeMath32.safe32(updatedWeight), true);
    }

    function _setTimeWeight(uint32 weight, bool active) internal {
        uint32 blockNo = SafeMath32.safe32(block.number);
        timeWeightInfo = TimeWeightInfo(blockNo, weight, getGrowthRate(), active);
        emit TimeWeightUpdate(weight, active);   
    }
}