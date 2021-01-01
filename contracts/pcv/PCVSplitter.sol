pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title abstract contract for splitting PCV into different deposits
/// @author Fei Protocol
abstract contract PCVSplitter {

	/// @notice total allocation allowed representing 100%
	uint public constant ALLOCATION_GRANULARITY = 10_000; 

	uint[] private ratios;
	address[] private pcvDeposits;

	event AllocationUpdate(address[] _pcvDeposits, uint[] _ratios);

	/// @notice PCVSplitter constructor
	/// @param _pcvDeposits list of PCV Deposits to split to
	/// @param _ratios ratios for splitting PCV Deposit allocations
	constructor(address[] memory _pcvDeposits, uint[] memory _ratios) public {
		_setAllocation(_pcvDeposits, _ratios);
	}

	/// @notice make sure an allocation has matching lengths and totals the ALLOCATION_GRANULARITY
	/// @param _pcvDeposits new list of pcv deposits to send to
	/// @param _ratios new ratios corresponding to the PCV deposits
	/// @return true if it is a valid allocation
	function checkAllocation(address[] memory _pcvDeposits, uint[] memory _ratios) public pure returns (bool) {
		require(_pcvDeposits.length == _ratios.length, "PCVSplitter: PCV Deposits and ratios are different lengths");

		uint total;
		for (uint i; i < _ratios.length; i++) {
			total += _ratios[i];
		}

		require(total == ALLOCATION_GRANULARITY, "PCVSplitter: ratios do not total 100%");
		
		return true;
	}
	
	/// @notice gets the pcvDeposits and ratios of the splitter
	function getAllocation() public view returns (address[] memory, uint[] memory) {
		return (pcvDeposits, ratios);
	}

	/// @notice distribute funds to single PCV deposit
	/// @param amount amount of funds to send
	/// @param pcvDeposit the pcv deposit to send funds
	function _allocateSingle(uint amount, address pcvDeposit) internal virtual ;

	/// @notice sets a new allocation for the splitter
	/// @param _pcvDeposits new list of pcv deposits to send to
	/// @param _ratios new ratios corresponding to the PCV deposits. Must total ALLOCATION_GRANULARITY
	function _setAllocation(address[] memory _pcvDeposits, uint[] memory _ratios) internal {
		checkAllocation(_pcvDeposits, _ratios);

		pcvDeposits = _pcvDeposits;
		ratios = _ratios;

		emit AllocationUpdate(_pcvDeposits, _ratios);
	}

	/// @notice distribute funds to all pcv deposits at specified allocation ratios
	/// @param total amount of funds to send
	function _allocate(uint total) internal {
		uint granularity = ALLOCATION_GRANULARITY;
		for (uint i; i < ratios.length; i++) {
			uint amount = total * ratios[i] / granularity;
			_allocateSingle(amount, pcvDeposits[i]);
		}
	}
}