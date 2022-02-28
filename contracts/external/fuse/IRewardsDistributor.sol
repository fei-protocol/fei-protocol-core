// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IRewardsDistributor {
    function _addMarketForRewards(address cToken) external;

    function claimRewards(address holder) external;

    function getAllMarkets() external view returns (address[] memory);
}
