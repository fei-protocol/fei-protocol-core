pragma solidity ^0.6.2;

interface IAllocation {
    function deposit(uint256 amount) external payable;

    function withdraw(uint256 amount) external;

    function totalValue() external view returns(uint256);
}
