pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract AllocationRule {

	uint16 public constant GRANULARITY = 10_000; // total allocation allowed
	address[] private pcvDeposits;
	uint16[] private ratios;

	constructor(address[] memory _pcvDeposits, uint16[] memory _ratios) public {
		_setAllocation(_pcvDeposits, _ratios);
	}

	function checkAllocation(address[] memory _pcvDeposits, uint16[] memory _ratios) public view returns (bool) {
		require(_pcvDeposits.length == _ratios.length, "Allocation Rule: PCV Deposits and ratios are different lengths");
		uint16 total = 0;
		for (uint16 i = 0; i < _ratios.length; i++) {
			total += _ratios[i];
		}
		require(total == GRANULARITY, "Allocation Rule: ratios do not total 100%");
		return true;
	}
	
	function getAllocationRule() public view returns (address[] memory, uint16[] memory) {
		return (pcvDeposits, ratios);
	}

	function allocateSingle(uint256 amount, address pcvDeposit) internal virtual ;

	function _setAllocation(address[] memory _pcvDeposits, uint16[] memory _ratios) internal {
		checkAllocation(_pcvDeposits, _ratios);
		pcvDeposits = _pcvDeposits;
		ratios = _ratios;
	}

	function allocate(uint256 total) internal {
		for (uint16 i = 0; i < ratios.length; i++) {
			uint256 amount = total * ratios[i] / GRANULARITY;
			allocateSingle(amount, pcvDeposits[i]);
		}
	}
}