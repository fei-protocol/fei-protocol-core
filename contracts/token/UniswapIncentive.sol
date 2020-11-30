pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IIncentive.sol";
import "../external/Decimal.sol";
import "../oracle/IOracle.sol";
import "../refs/UniRef.sol";
import "@openzeppelin/contracts/math/Math.sol";

contract UniswapIncentive is IIncentive, UniRef {
	using Decimal for Decimal.D256;
    using Babylonian for uint256;

    struct TimeWeightInfo {
        uint256 blockNo;
        uint256 weight;
        uint256 growthRate;
        bool active;
    }

	mapping(address => address) private _oracles;
	mapping(address => bool) private _exempt;
    mapping(address => TimeWeightInfo) public _timeWeights;

	bool private KILL_SWITCH = false;
    uint256 public constant TIME_WEIGHT_GRANULARITY = 1e5;
    uint256 public constant DEFAULT_INCENTIVE_GROWTH_RATE = 333; // about 1 unit per hour assuming 12s block time

	constructor(address core) 
		UniRef(core)
	public {}

    function incentivize(
    	address sender, 
    	address receiver, 
    	address spender, 
    	uint256 amountIn
    ) public override onlyFei {
    	if (KILL_SWITCH) {
    		return;
    	}

    	if (isIncentivized(sender)) {
    		incentivizeBuy(receiver, sender, amountIn);
    	}

    	if (isIncentivized(receiver)) {
    		incentivizeSell(sender, receiver, amountIn);
    	}
    }

    function setExemptAddress(address account, bool isExempt) public onlyGovernor {
    	_exempt[account] = isExempt;
    }

    function setKillSwitch(bool enabled) public onlyGovernor {
    	KILL_SWITCH = enabled;
    }

    function setOracle(address account, address oracle) public onlyGovernor {
    	_oracles[account] = oracle;
        _timeWeights[account] = TimeWeightInfo(block.number, 0, DEFAULT_INCENTIVE_GROWTH_RATE, false);
    }

    function setTimeWeightGrowth(address account, uint growthRate) public onlyGovernor {
        require(isIncentivized(account), "UniswapIncentive: Account not incentivized");
        TimeWeightInfo memory tw = _timeWeights[account];
        _timeWeights[account] = TimeWeightInfo(tw.blockNo, tw.weight, growthRate, tw.active);
    }

    function getGrowthRate(address _pair) public view returns (uint256) {
        return _timeWeights[_pair].growthRate;
    }

    function getTimeWeight(address _pair) public view returns (uint256) {
        TimeWeightInfo memory tw = _timeWeights[_pair];
        if (!tw.active) {
            return 0;
        }
        return tw.weight + ((block.number - tw.blockNo) * tw.growthRate);
    }

    function setTimeWeight(address _pair, uint blockNo, uint weight, uint growth, bool active) public onlyGovernor {
        require(isIncentivized(_pair), "UniswapIncentive: Account not incentivized");
        _timeWeights[_pair] = TimeWeightInfo(blockNo, weight, growth, active);
    }

    function isExemptAddress(address account) public view returns (bool) {
    	return _exempt[account];
    }

    function isKillSwitchEnabled() public view returns (bool) {
    	return KILL_SWITCH;
    }

    function getOracle(address account) public view returns (address) {
    	return _oracles[account];
    }

    function isIncentivized(address account) public view returns (bool) {
    	return getOracle(account) != address(0x0);
    }

    function incentivizeBuy(address target, address _pair, uint256 amountIn) internal {
    	if (isExemptAddress(target)) {
    		return;
    	}
    	Decimal.D256 memory peg = getPeg(_pair);
    	(Decimal.D256 memory price, uint reserveFei, uint reserveOther) = getUniswapPrice(_pair);

    	Decimal.D256 memory initialDeviation = getPriceDeviation(price, peg);
    	if (initialDeviation.equals(Decimal.zero())) {
    		return;
    	}

    	Decimal.D256 memory finalPrice = getFinalPrice(
    		-1 * int256(amountIn), 
    		reserveFei, 
    		reserveOther
    	);
    	Decimal.D256 memory finalDeviation = getPriceDeviation(finalPrice, peg);

    	uint256 incentivizedAmount = amountIn;
        if (finalDeviation.equals(Decimal.zero())) {
            incentivizedAmount = getAmountToPeg(reserveFei, reserveOther, peg);
        }

        uint256 weight = getTimeWeight(_pair);
        uint256 incentive = calculateBuyIncentive(initialDeviation, incentivizedAmount, weight);
        updateTimeWeight(initialDeviation, finalDeviation, _pair, weight);
    	fei().mint(target, incentive);
    }

    function updateTimeWeight (
        Decimal.D256 memory initialDeviation, 
        Decimal.D256 memory finalDeviation, 
        address _pair,
        uint256 currentWeight
    ) internal {
        // Reset after completion
        if (finalDeviation.equals(Decimal.zero())) {
            _timeWeights[_pair] = TimeWeightInfo(block.number, 0, getGrowthRate(_pair), false);
            return;
        } 
        // Init
        if (initialDeviation.equals(Decimal.zero())) {
            _timeWeights[_pair] = TimeWeightInfo(block.number, 0, getGrowthRate(_pair), true);
            return;
        }

        uint256 updatedWeight = currentWeight;
        // Partial buy
        if (initialDeviation.greaterThan(finalDeviation)) {
            Decimal.D256 memory remainingRatio = finalDeviation.div(initialDeviation);
            updatedWeight = remainingRatio.mul(currentWeight).asUint256();
        }
        _timeWeights[_pair] = TimeWeightInfo(block.number, updatedWeight, getGrowthRate(_pair), true);
    }

    function incentivizeSell(address target, address _pair, uint256 amount) internal {
    	if (isExemptAddress(target)) {
    		return;
    	}

    	Decimal.D256 memory peg = getPeg(_pair);
    	(Decimal.D256 memory price, uint reserveFei, uint reserveOther) = getUniswapPrice(_pair);

    	Decimal.D256 memory finalPrice = getFinalPrice(int256(amount), reserveFei, reserveOther);
    	Decimal.D256 memory finalDeviation = getPriceDeviation(finalPrice, peg);

    	if (finalDeviation.equals(Decimal.zero())) {
    		return;
    	}

    	Decimal.D256 memory initialDeviation = getPriceDeviation(price, peg);
        uint256 incentivizedAmount = amount;
        if (initialDeviation.equals(Decimal.zero())) {
            uint256 amountToPeg = getAmountToPeg(reserveFei, reserveOther, peg);
            if (amountToPeg < amount) {
                incentivizedAmount = amount - amountToPeg;
            } else {
                incentivizedAmount = 0;
            }
        }
    	uint256 penalty = calculateSellPenalty(finalDeviation, incentivizedAmount);
        uint256 weight = getTimeWeight(_pair);
        updateTimeWeight(initialDeviation, finalDeviation, _pair, weight);
    	fei().burnFrom(target, penalty);
    }

    function getPeg(address _pair) internal returns (Decimal.D256 memory) {
    	IOracle oracle = IOracle(getOracle(_pair));
    	require(address(oracle) != address(0), "UniswapIncentive: no oracle for pair");
    	(Decimal.D256 memory peg, bool valid) = oracle.capture();
    	require(valid, "UniswapIncentive: oracle error");
    	return peg;
    }

    function calculateBuyIncentive(
    	Decimal.D256 memory initialDeviation, 
    	uint256 amountIn,
        uint256 weight
    ) internal view returns (uint256) {
        uint256 correspondingPenalty = calculateSellPenalty(initialDeviation, amountIn);
        uint256 incentive = initialDeviation.mul(amountIn).mul(weight).div(TIME_WEIGHT_GRANULARITY).asUint256();
    	return Math.min(incentive, correspondingPenalty);
    }

    function calculateSellPenalty(
    	Decimal.D256 memory finalDeviation, 
    	uint256 amount
    ) internal pure returns (uint256) {
    	return finalDeviation.mul(finalDeviation).mul(amount).mul(100).asUint256(); // m^2 * x * 100
    }

    function getPriceDeviation(
        Decimal.D256 memory price, 
        Decimal.D256 memory peg
    ) internal pure returns (Decimal.D256 memory) {
        // If price <= peg, then FEI is more expensive and above peg
        // In this case we can just return zero for deviation
        if (price.lessThanOrEqualTo(peg)) {
            return Decimal.zero();
        }
        Decimal.D256 memory delta = price.sub(peg, "UniswapIncentive: price exceeds peg"); // Should never error
        return delta.div(peg);
    }
}