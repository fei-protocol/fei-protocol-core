// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IWeightedBalancerPoolManager.sol";
import "./BaseBalancerPoolManager.sol";

/// @title WeightedBalancerPoolManager
/// @notice an abstract utility class for a contract that manages a Balancer WeightedPool (including LBP)
/// exposes the governable methods to Fei Governors or admins
abstract contract WeightedBalancerPoolManager is IWeightedBalancerPoolManager, BaseBalancerPoolManager {
    constructor() BaseBalancerPoolManager() {}

    function setSwapEnabled(IWeightedPool pool, bool swapEnabled) public override onlyGovernorOrAdmin {
        pool.setSwapEnabled(swapEnabled);
    }

    function updateWeightsGradually(
        IWeightedPool pool,
        uint256 startTime,
        uint256 endTime,
        uint256[] memory endWeights
    ) public override onlyGovernorOrAdmin {
        _updateWeightsGradually(pool, startTime, endTime, endWeights);
    }

    function _updateWeightsGradually(
        IWeightedPool pool,
        uint256 startTime,
        uint256 endTime,
        uint256[] memory endWeights
    ) internal {
        pool.updateWeightsGradually(startTime, endTime, endWeights);
    }

    function withdrawCollectedManagementFees(IWeightedPool pool, address recipient)
        public
        override
        onlyGovernorOrAdmin
    {
        pool.withdrawCollectedManagementFees(recipient);
    }
}
