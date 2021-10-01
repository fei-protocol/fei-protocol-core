// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity ^0.8.0;

// interface intended to extend the balancer RewardsAssetManager
// https://github.com/balancer-labs/balancer-v2-monorepo/blob/389b52f1fc9e468de854810ce9dc3251d2d5b212/pkg/asset-manager-utils/contracts/RewardsAssetManager.sol
interface IRewardsAssetManager {
    // ----------- Governor only state changing api -----------
    function setNewAggregator(address newAggregator) external;

    // ----------- Read-only api -----------
    function pcvDepositAggregator() external returns(address);
}