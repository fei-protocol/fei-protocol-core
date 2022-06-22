// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IBasePool.sol";

// interface with required methods from Balancer V2 WeightedPool
// https://github.com/balancer-labs/balancer-v2-monorepo/blob/389b52f1fc9e468de854810ce9dc3251d2d5b212/pkg/pool-weighted/contracts/WeightedPool.sol
interface IWeightedPool is IBasePool {
    function getSwapEnabled() external view returns (bool);

    function getNormalizedWeights() external view returns (uint256[] memory);

    function getGradualWeightUpdateParams()
        external
        view
        returns (
            uint256 startTime,
            uint256 endTime,
            uint256[] memory endWeights
        );

    function setSwapEnabled(bool swapEnabled) external;

    function updateWeightsGradually(
        uint256 startTime,
        uint256 endTime,
        uint256[] memory endWeights
    ) external;

    function withdrawCollectedManagementFees(address recipient) external;

    enum JoinKind {
        INIT,
        EXACT_TOKENS_IN_FOR_BPT_OUT,
        TOKEN_IN_FOR_EXACT_BPT_OUT
    }
    enum ExitKind {
        EXACT_BPT_IN_FOR_ONE_TOKEN_OUT,
        EXACT_BPT_IN_FOR_TOKENS_OUT,
        BPT_IN_FOR_EXACT_TOKENS_OUT
    }
}
