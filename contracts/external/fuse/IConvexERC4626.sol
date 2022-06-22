// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IConvexERC4626 {
    function rewardTokens(uint256 index) external view returns (address);

    function updateRewardTokens() external;
}
