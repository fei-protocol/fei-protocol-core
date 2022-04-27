// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../IWeightedPool.sol";
import "./IBaseBalancerPoolManager.sol";

interface IWeightedBalancerPoolManager is IBaseBalancerPoolManager {
    // ----------- Governor or admin only state changing API -----------
    function setSwapEnabled(IWeightedPool pool, bool swapEnabled) external;

    function updateWeightsGradually(
        IWeightedPool pool,
        uint256 startTime,
        uint256 endTime,
        uint256[] memory endWeights
    ) external;

    function withdrawCollectedManagementFees(IWeightedPool pool, address recipient) external;
}
