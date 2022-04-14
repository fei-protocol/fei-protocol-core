// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../IStablePool.sol";
import "../IPhantomStablePool.sol";
import "./BaseBalancerPoolManager.sol";

/// @title StableBalancerPoolManager
/// @notice an abstract utility class for a contract that manages a Balancer StablePool
/// (and phantom stable pools). Exposes the governable methods to Fei Governors or admins.
contract StableBalancerPoolManager is BaseBalancerPoolManager {
    constructor(address _core) BaseBalancerPoolManager() CoreRef(_core) {}

    function startAmplificationParameterUpdate(
        address pool,
        uint256 rawEndValue,
        uint256 endTime
    ) external onlyGovernorOrAdmin {
        IStablePool(pool).startAmplificationParameterUpdate(
            rawEndValue,
            endTime
        );
    }

    function stopAmplificationParameterUpdate(address pool)
        external
        onlyGovernorOrAdmin
    {
        IStablePool(pool).stopAmplificationParameterUpdate();
    }

    function setTokenRateCacheDuration(
        address pool,
        address[] calldata token,
        uint256[] calldata duration
    ) external onlyGovernorOrAdmin {
        for (uint256 i = 0; i < token.length; i++) {
            IPhantomStablePool(pool).setTokenRateCacheDuration(
                token[i],
                duration[i]
            );
        }
    }
}
