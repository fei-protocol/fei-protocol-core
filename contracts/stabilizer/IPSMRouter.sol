pragma solidity ^0.8.4;

interface IPSMRouter {
    event EthDepositedForFei(address to, uint256 amount);
    
    function swapExactETHForFei(address to, uint256 deadline) external payable;
    function swapExactETHForExactFei(address to, uint256 amountsOutMin, uint256 deadline) external payable;
    function swapExactFeiForExactTokens(address to, uint256 amountFeiIn, uint256 amountsOutMin, uint256 deadline) external payable;
}
