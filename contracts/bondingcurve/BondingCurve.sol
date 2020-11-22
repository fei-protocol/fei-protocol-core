pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IBondingCurve.sol";
import "../oracle/IOracle.sol";
import "../core/CoreRef.sol";
import "../allocation/AllocationRule.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

abstract contract BondingCurve is IBondingCurve, CoreRef, AllocationRule {
    using Decimal for Decimal.D256;

	uint256 private SCALE;
	uint256 private _totalPurchased = 0;
	uint256 private BUFFER = 100;
	uint256 private BUFFER_GRANULARITY = 10_000;
	IOracle private ORACLE;

	constructor(
		uint256 _scale, 
		address core, 
		address[] memory allocations, 
		uint16[] memory ratios, 
		address oracle
	)
		CoreRef(core)
		AllocationRule(allocations, ratios)
	public {
		setScale(_scale);
		setOracle(oracle);
	}

	// TODO oracle ref?
	function oracle() public view returns(IOracle) {
		return ORACLE;
	}

	function atScale() public override view returns (bool) {
		return _totalPurchased > SCALE;
	}

	function setScale(uint256 _scale) public override {
		SCALE = _scale;
	}

	function setOracle(address oracle) public {
		ORACLE = IOracle(oracle);
	}

	function setBuffer(uint256 _buffer) public onlyGovernor {
		require(_buffer <= BUFFER_GRANULARITY);
		BUFFER = _buffer;
	}

	function setAllocation(address[] memory allocations, uint16[] memory ratios) public onlyGovernor {
		_setAllocation(allocations, ratios);
	}

	function totalPurchased() public view returns (uint256) {
		return _totalPurchased;
	}

	function scale() public override view returns (uint256) {
		return SCALE;
	}

	function buffer() public view returns (uint256) {
		return BUFFER;
	}

	function bufferGranularity() public view returns (uint256) {
		return BUFFER_GRANULARITY;
	}

	function getBondingCurveAmountOut(uint256 amountIn) public view virtual returns(uint256);

	function getAmountOut(uint256 amountIn) internal returns (uint256 amountOut) {
		(Decimal.D256 memory price, bool valid) = oracle().capture();
		uint256 adjustedAmount = price.mul(amountIn).asUint256();
		if (atScale()) {
			return getBufferAdjustedAmount(adjustedAmount);
		}
		return getBondingCurveAmountOut(adjustedAmount); // TODO? edge case transitioning to scale
	}

	function _purchase(uint256 amountIn, address to) internal returns (uint256 amountOut) {
	 	amountOut = getAmountOut(amountIn);
	 	incrementTotalPurchased(amountOut);
		fii().mint(to, amountOut);
		allocate(amountIn);
		return amountOut;
	}

	function incrementTotalPurchased(uint256 amount) internal {
		_totalPurchased += amount;
	}

	function getBufferAdjustedAmount(uint256 amountIn) internal view returns(uint256) {
		return amountIn * (BUFFER + BUFFER_GRANULARITY) / BUFFER_GRANULARITY;
	}

	// TODO move to math lib
	function sqrt(uint y) internal pure returns (uint z) {
	    if (y > 3) {
	        z = y;
	        uint x = y / 2 + 1;
	        while (x < z) {
	            z = x;
	            x = (y / x + x) / 2;
	        }
	    } else if (y != 0) {
	        z = 1;
	    }
	}
}