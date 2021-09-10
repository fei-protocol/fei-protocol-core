// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../../refs/CoreRef.sol";
import "./IBaseBalancerPoolManager.sol";

contract BaseBalancerPoolManager is IBaseBalancerPoolManager, CoreRef {
    
    constructor(address _core) CoreRef(_core) {}

    function setSwapFee(IBasePool pool, uint256 swapFee) external override onlyGovernorOrAdmin {
        pool.setSwapFeePercentage(swapFee);
    }

    function setPaused(IBasePool pool, bool paused) external override onlyGovernorOrAdmin {
        pool.setPaused(paused);
    }

    function setAssetManagerPoolConfig(
        IBasePool pool, 
        IERC20 token, 
        IAssetManager.PoolConfig memory poolConfig
    ) external override onlyGovernorOrAdmin {
        pool.setAssetManagerPoolConfig(token, poolConfig);
    }
}