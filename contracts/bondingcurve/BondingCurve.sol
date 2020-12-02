pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IBondingCurve.sol";
import "./AllocationRule.sol";
import "../refs/OracleRef.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@uniswap/lib/contracts/libraries/Babylonian.sol";

abstract contract BondingCurve is IBondingCurve, OracleRef, AllocationRule {
    using Decimal for Decimal.D256;
    using Babylonian for uint256;

	uint256 public override scale;
	uint256 public totalPurchased = 0; // FEI_b for this curve
	uint256 public buffer = 100;
	uint256 public constant BUFFER_GRANULARITY = 10_000;

	constructor(
		uint256 _scale, 
		address core, 
		address[] memory allocations, 
		uint16[] memory ratios, 
		address _oracle
	)
		OracleRef(core)
		AllocationRule(allocations, ratios)
	public {
		_setScale(_scale);
		_setOracle(_oracle);
	}

	function atScale() public override view returns (bool) {
		return totalPurchased >= scale;
	}

	function setScale(uint256 _scale) public override onlyGovernor {
		_setScale(_scale);
	}

	function setBuffer(uint256 _buffer) public onlyGovernor {
		require(_buffer < BUFFER_GRANULARITY, "BondingCurve: Buffer exceeds or matches granularity");
		buffer = _buffer;
	}

	function setAllocation(address[] memory allocations, uint16[] memory ratios) public onlyGovernor {
		_setAllocation(allocations, ratios);
	}

	function getCurrentPrice() public view override returns(Decimal.D256 memory) {
		if (atScale()) {
			return invert(peg()).div(getBuffer());
		}
		return peg().mul(getBondingCurvePriceMultiplier());
	}

	function getAmountOut(uint256 amountIn) public view override returns (uint256 amountOut) {
		uint256 adjustedAmount = peg().mul(amountIn).asUint256();
		if (atScale()) {
			return getBufferAdjustedAmount(adjustedAmount);
		}
		return getBondingCurveAmountOut(adjustedAmount);
	}

	function getBondingCurvePriceMultiplier() internal view virtual returns(uint256);

	function getBondingCurveAmountOut(uint256 adjustedAmountIn) internal view virtual returns(uint256);

	function _purchase(uint256 amountIn, address to) internal returns (uint256 amountOut) {
	 	amountOut = getAmountOut(amountIn);
	 	incrementTotalPurchased(amountOut);
		fei().mint(to, amountOut);
		allocate(amountIn);
		return amountOut;
	}

	function incrementTotalPurchased(uint256 amount) internal {
		totalPurchased += amount;
	}

	function _setScale(uint256 _scale) internal {
		scale = _scale;
	}

	function getBuffer() internal view returns(Decimal.D256 memory) {
		return Decimal.ratio(BUFFER_GRANULARITY - buffer, BUFFER_GRANULARITY);
	} 

	function getBufferAdjustedAmount(uint256 amountIn) internal view returns(uint256) {
		return getBuffer().mul(amountIn).asUint256();
	}
}