pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IUniswapIncentive.sol";
import "../external/Decimal.sol";
import "../oracle/IOracle.sol";
import "../refs/UniRef.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract UniswapIncentive is IUniswapIncentive, UniRef {
	using Decimal for Decimal.D256;
    using Babylonian for uint256;

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

	constructor(address core, address _oracle) 
		UniRef(core)
	public {
        _setOracle(_oracle);
        timeWeightInfo = TimeWeightInfo(block.number, 0, DEFAULT_INCENTIVE_GROWTH_RATE, false);
    }

    function incentivize(
    	address sender, 
    	address receiver, 
    	address spender, 
    	uint256 amountIn
    ) public override onlyFei {

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

    function isIncentiveParity() public override returns (bool) {
        uint weight = getTimeWeight();
        require(weight != 0, "UniswapIncentive: Incentive zero or not active");

        (Decimal.D256 memory price,,) = getUniswapPrice();
        Decimal.D256 memory deviation = calculateDeviation(price, peg());
        require(!deviation.equals(Decimal.zero()), "UniswapIncentive: Price already at or above peg");

        Decimal.D256 memory incentive = calculateBuyIncentiveMultiplier(deviation, weight);
        Decimal.D256 memory penalty = calculateSellPenaltyMultiplier(deviation);
        return incentive.equals(penalty);
    }

    function incentivizeBuy(address target, uint256 amountIn) internal ifMinterSelf {
    	if (isExemptAddress(target)) {
    		return;
    	}

        (Decimal.D256 memory initialDeviation, Decimal.D256 memory finalDeviation) = getPriceDeviations(-1 * int256(amountIn));
    	if (initialDeviation.equals(Decimal.zero())) {
    		return;
    	}

    	uint256 incentivizedAmount = amountIn;
        if (finalDeviation.equals(Decimal.zero())) {
            incentivizedAmount = getAmountToPegFei();
        }

        uint256 weight = getTimeWeight();
        uint256 incentive = calculateBuyIncentive(initialDeviation, incentivizedAmount, weight);
        updateTimeWeight(initialDeviation, finalDeviation, weight);
    	fei().mint(target, incentive);
    }

    function incentivizeSell(address target, uint256 amount) internal ifBurnerSelf {
    	if (isExemptAddress(target)) {
    		return;
    	}

        (Decimal.D256 memory initialDeviation, Decimal.D256 memory finalDeviation) = getPriceDeviations(int256(amount));

    	if (finalDeviation.equals(Decimal.zero())) {
    		return;
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
    	uint256 penalty = calculateSellPenalty(finalDeviation, incentivizedAmount);
        uint256 weight = getTimeWeight();
        updateTimeWeight(initialDeviation, finalDeviation, weight);
    	fei().burnFrom(target, penalty);
    }

    function calculateBuyIncentive(
    	Decimal.D256 memory initialDeviation, 
    	uint256 amountIn,
        uint256 weight
    ) internal view returns (uint256) {
    	return calculateBuyIncentiveMultiplier(initialDeviation, weight).mul(amountIn).asUint256();
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
        return deviation.mul(deviation).mul(100);
    }

    function calculateSellPenalty(
    	Decimal.D256 memory finalDeviation, 
    	uint256 amount
    ) internal pure returns (uint256) {
    	return calculateSellPenaltyMultiplier(finalDeviation).mul(amount).asUint256(); // m^2 * x * 100
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
        timeWeightInfo = TimeWeightInfo(block.number, updatedWeight, getGrowthRate(), true);
    }
}