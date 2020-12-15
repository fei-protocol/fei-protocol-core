pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IUniswapIncentive.sol";
import "../external/Decimal.sol";
import "../oracle/IOracle.sol";
import "../refs/UniRef.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract UniswapIncentive is IUniswapIncentive, UniRef {
	using Decimal for Decimal.D256;

    // TODO packing
    struct TimeWeightInfo {
        uint256 blockNo;
        uint256 weight;
        uint256 growthRate;
        bool active;
    }

	mapping(address => bool) private _exempt;

    TimeWeightInfo public timeWeightInfo;

    uint256 public constant TIME_WEIGHT_GRANULARITY = 1e5;
    uint256 public constant DEFAULT_INCENTIVE_GROWTH_RATE = 333; // about 1 unit per hour assuming 12s block time

	constructor(address core, address _oracle) public
	UniRef(core) {
        _setOracle(_oracle);
        timeWeightInfo = TimeWeightInfo(block.number, 0, DEFAULT_INCENTIVE_GROWTH_RATE, false);
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

    function setExemptAddress(address account, bool isExempt) public onlyGovernor {
    	_exempt[account] = isExempt;
    }

    function setTimeWeightGrowth(uint growthRate) public onlyGovernor {
        TimeWeightInfo memory tw = timeWeightInfo;
        timeWeightInfo = TimeWeightInfo(tw.blockNo, tw.weight, growthRate, tw.active);
    }

    function getGrowthRate() public view returns (uint256) {
        return timeWeightInfo.growthRate;
    }

    function getTimeWeight() public view returns (uint256) {
        TimeWeightInfo memory tw = timeWeightInfo;
        if (!tw.active) {
            return 0;
        }
        return tw.weight + ((block.number - tw.blockNo) * tw.growthRate);
    }

    function setTimeWeight(uint blockNo, uint weight, uint growth, bool active) public onlyGovernor {
        timeWeightInfo = TimeWeightInfo(blockNo, weight, growth, active);
    }

    function isExemptAddress(address account) public view returns (bool) {
    	return _exempt[account];
    }

    function isIncentiveParity() public view override returns (bool) {
        uint weight = getTimeWeight();
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
        uint256 weight,
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
            if (amountToPeg < amount) {
                incentivizedAmount = amount - amountToPeg;
            } else {
                incentivizedAmount = 0;
            }
        }
        Decimal.D256 memory multiplier = calculateSellPenaltyMultiplier(finalDeviation); 
        penalty = multiplier.mul(incentivizedAmount).asUint256(); 
        return (penalty, initialDeviation, finalDeviation);   
    }

    function incentivizeBuy(address target, uint256 amountIn) internal ifMinterSelf {
    	if (isExemptAddress(target)) {
    		return;
    	}

        (uint256 incentive, uint256 weight,
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

        uint256 weight = getTimeWeight();
        updateTimeWeight(initialDeviation, finalDeviation, weight);
        if (penalty != 0) {
            fei().burnFrom(target, penalty);
        }
    }

    function calculateBuyIncentiveMultiplier(
        Decimal.D256 memory deviation,
        uint weight
    ) internal pure returns (Decimal.D256 memory) {
        Decimal.D256 memory correspondingPenalty = calculateSellPenaltyMultiplier(deviation);
        Decimal.D256 memory buyMultiplier = deviation.mul(weight).div(TIME_WEIGHT_GRANULARITY);
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
        uint256 currentWeight
    ) internal {
        // Reset after completion
        if (finalDeviation.equals(Decimal.zero())) {
            timeWeightInfo = TimeWeightInfo(block.number, 0, getGrowthRate(), false);
            return;
        } 
        // Init
        if (initialDeviation.equals(Decimal.zero())) {
            timeWeightInfo = TimeWeightInfo(block.number, 0, getGrowthRate(), true);
            return;
        }

        uint256 updatedWeight = currentWeight;
        // Partial buy
        if (initialDeviation.greaterThan(finalDeviation)) {
            Decimal.D256 memory remainingRatio = finalDeviation.div(initialDeviation);
            updatedWeight = remainingRatio.mul(currentWeight).asUint256();
        }
        uint maxWeight = finalDeviation.mul(100).mul(TIME_WEIGHT_GRANULARITY).asUint256(); // m^2*100 (sell) = t*m (buy) 
        updatedWeight = Math.min(updatedWeight, maxWeight);
        timeWeightInfo = TimeWeightInfo(block.number, updatedWeight, getGrowthRate(), true);
    }
}