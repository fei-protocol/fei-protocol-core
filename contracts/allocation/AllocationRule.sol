pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract AllocationRule {

	uint16 private GRANULARITY = 10_000; // total allocation allowed
	address[] ALLOCATIONS;
	uint16[] RATIOS;

	constructor(address[] memory allocations, uint16[] memory ratios) public {
		_setAllocation(allocations, ratios);
	}

	function checkAllocation(address[] memory allocations, uint16[] memory ratios) public view returns (bool) {
		require(allocations.length == ratios.length, "Allocation Rule: allocations and ratios are different lengths");
		uint16 total = 0;
		for (uint16 i = 0; i < ratios.length; i++) {
			total += ratios[i];
		}
		require(total == GRANULARITY, "Allocation Rule: ratios do not total 100%");
		return true;
	}
	
	function getAllocations() public view returns (address[] memory, uint16[] memory) {
		return (ALLOCATIONS, RATIOS);
	}

	function allocateSingle(uint256 amount, address allocation) internal virtual ;

	function _setAllocation(address[] memory allocations, uint16[] memory ratios) internal {
		checkAllocation(allocations, ratios);
		ALLOCATIONS = allocations;
		RATIOS = ratios;
	}

	function allocate(uint256 total) internal {
		for (uint16 i = 0; i < RATIOS.length; i++) {
			uint256 amount = total * RATIOS[i] / GRANULARITY;
			allocateSingle(amount, ALLOCATIONS[i]);
		}
	}
}