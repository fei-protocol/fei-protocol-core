// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../../refs/CoreRef.sol";
import "./IBaseBalancerPoolManager.sol";

/// @title BaseBalancerPoolManager
/// @notice an abstract utility class for a contract that manages a Balancer BasePool
/// exposes the governable methods to Fei Governors or admins
abstract contract BaseBalancerPoolManager is IBaseBalancerPoolManager, CoreRef {
    constructor() {
        _setContractAdminRole(keccak256("BALANCER_MANAGER_ADMIN_ROLE"));
    }

    function setSwapFee(IBasePool pool, uint256 swapFee) public override onlyGovernorOrAdmin {
        pool.setSwapFeePercentage(swapFee);
    }

    function setPaused(IBasePool pool, bool paused) public override onlyGovernorOrAdmin {
        pool.setPaused(paused);
    }

    function setAssetManagerPoolConfig(
        IBasePool pool,
        IERC20 token,
        IAssetManager.PoolConfig memory poolConfig
    ) public override onlyGovernorOrAdmin {
        pool.setAssetManagerPoolConfig(token, poolConfig);
    }
}
