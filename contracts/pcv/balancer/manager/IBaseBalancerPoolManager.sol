// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../IBasePool.sol";

interface IBaseBalancerPoolManager {
    // ----------- Governor or admin only state changing API -----------
    function setSwapFee(IBasePool pool, uint256 swapFee) external;

    function setPaused(IBasePool pool, bool paused) external;

    function setAssetManagerPoolConfig(
        IBasePool pool,
        IERC20 token,
        IAssetManager.PoolConfig memory poolConfig
    ) external;
}
