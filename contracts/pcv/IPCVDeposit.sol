pragma solidity ^0.6.2;

interface IPCVDeposit {
    function deposit(uint256 amount) external payable;

    function withdraw(address to, uint256 amount) external;

    function totalValue() external view returns(uint256);
}
