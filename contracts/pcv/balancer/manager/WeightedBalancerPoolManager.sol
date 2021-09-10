// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IWeightedBalancerPoolManager.sol";
import "./BaseBalancerPoolManager.sol";

contract WeightedBalancerPoolManager is IWeightedBalancerPoolManager, BaseBalancerPoolManager {
    
    constructor(address _core) BaseBalancerPoolManager(_core) {}

    function setSwapEnabled(IWeightedPool pool, bool swapEnabled) external override onlyGovernorOrAdmin {
        pool.setSwapEnabled(swapEnabled);
    }

    function updateWeightsGradually(
        IWeightedPool pool,
        uint256 startTime,
        uint256 endTime,
        uint256[] memory endWeights
    ) external override onlyGovernorOrAdmin {
        pool.updateWeightsGradually(startTime, endTime, endWeights);
    }
}