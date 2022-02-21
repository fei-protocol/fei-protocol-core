// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface CErc20 is IERC20 {
    function underlying() external returns (address);
    function mint(uint256 amount) external returns (uint256);
    function redeemUnderlying(uint256 redeemAmount) external returns (uint256);
    function redeem(uint256 redeemTokens) external returns (uint256);
    function exchangeRateStored() external view returns (uint256);
    function exchangeRateCurrent() external returns (uint256);
    function isCToken() external view returns(bool);
    function isCEther() external view returns(bool);
    function getCash() external view returns(uint256);
    function totalBorrows() external view returns(uint256);
}
