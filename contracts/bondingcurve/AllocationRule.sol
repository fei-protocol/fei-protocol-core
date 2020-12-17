pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract AllocationRule {

	uint256 public constant GRANULARITY = 10_000; // total allocation allowed
	uint256[] private ratios;
	address[] private pcvDeposits;

	event AllocationUpdate(address[] _pcvDeposits, uint256[] _ratios);

	constructor(address[] memory _pcvDeposits, uint256[] memory _ratios) public {
		_setAllocation(_pcvDeposits, _ratios);
	}

	function checkAllocation(address[] memory _pcvDeposits, uint256[] memory _ratios) public pure returns (bool) {
		require(_pcvDeposits.length == _ratios.length, "Allocation Rule: PCV Deposits and ratios are different lengths");
		uint256 total;
		for (uint256 i; i < _ratios.length; i++) {
			total += _ratios[i];
		}
		require(total == GRANULARITY, "Allocation Rule: ratios do not total 100%");
		return true;
	}
	
	function getAllocationRule() public view returns (address[] memory, uint256[] memory) {
		return (pcvDeposits, ratios);
	}

	function allocateSingle(uint256 amount, address pcvDeposit) internal virtual ;

	function _setAllocation(address[] memory _pcvDeposits, uint256[] memory _ratios) internal {
		checkAllocation(_pcvDeposits, _ratios);
		pcvDeposits = _pcvDeposits;
		ratios = _ratios;
		emit AllocationUpdate(_pcvDeposits, _ratios);
	}

	function allocate(uint256 total) internal {
		uint256 granularity = GRANULARITY;
		for (uint256 i; i < ratios.length; i++) {
			uint256 amount = total * ratios[i] / granularity;
			allocateSingle(amount, pcvDeposits[i]);
		}
	}
}