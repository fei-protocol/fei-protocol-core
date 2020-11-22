pragma solidity ^0.6.2;

interface IIncentive {
    function getIncentiveAmount(bool isSender, address account, address counterparty, uint256 amountIn) external view returns (uint256 incentive, bool isMint);
}
