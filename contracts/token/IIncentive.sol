pragma solidity ^0.6.2;

interface IIncentive {
    function incentivize(address sender, address receiver, address spender, uint256 amountIn) external;
}
