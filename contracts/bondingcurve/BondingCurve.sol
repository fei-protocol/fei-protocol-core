pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IBondingCurve.sol";
import "../oracle/IOracle.sol";
import "../core/CoreRef.sol";
import "./AllocationRule.sol";

abstract contract BondingCurve is IBondingCurve, CoreRef, AllocationRule {

	uint256 private SCALE;
	uint256 private _totalPurchased = 0;
	IOracle private ORACLE;

	constructor(uint256 _scale, address core, address[] memory allocations, uint16[] memory ratios)
	CoreRef(core)
	AllocationRule(allocations, ratios)
	public {
		setScale(_scale);
	}

	function totalPurchased() public view returns (uint256) {
		return _totalPurchased;
	}

	function incrementTotalPurchased(uint256 amount) internal {
		_totalPurchased += amount;
	}

	function scale() public override view returns (uint256) {
		return SCALE;
	}

	function setScale(uint256 _scale) public override {
		SCALE = _scale;
	}

	function setOracle(address oracle) public {
		ORACLE = IOracle(oracle);
	}

	function setAllocation(address[] memory allocations, uint16[] memory ratios) public onlyGovernor {
		_setAllocation(allocations, ratios);
	}

	function oracle() public view returns(IOracle) {
		return ORACLE;
	}

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