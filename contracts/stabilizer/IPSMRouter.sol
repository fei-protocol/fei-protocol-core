pragma solidity ^0.8.4;

interface IPSMRouter {
    event EthDepositedForFei(address to, uint256 amount);
    
    function swapExactETHForExactFei(address to, uint256 amountsOutMin, uint256 deadline) external payable;
}
