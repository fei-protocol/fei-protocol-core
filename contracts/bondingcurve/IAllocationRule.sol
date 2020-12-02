pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

interface IAllocationRule {

	function checkAllocation(address[] calldata _pcvDeposits, uint16[] calldata _ratios) external view returns (bool);

	function getAllocationRule() external view returns (address[] memory, uint16[] memory);

}