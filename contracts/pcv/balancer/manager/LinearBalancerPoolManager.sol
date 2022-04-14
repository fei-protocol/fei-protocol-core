// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../ILinearPool.sol";
import "./BaseBalancerPoolManager.sol";

/// @title LinearBalancerPoolManager
/// @notice an abstract utility class for a contract that manages a Balancer LinearPool
/// exposes the governable methods to Fei Governors or admins
contract LinearBalancerPoolManager is BaseBalancerPoolManager {
    constructor(address _core) BaseBalancerPoolManager() CoreRef(_core) {}

    function setTargets(
        address pool,
        uint256 newLowerTarget,
        uint256 newUpperTarget
    ) external onlyGovernorOrAdmin {
        ILinearPool(pool).setTargets(newLowerTarget, newUpperTarget);
    }
}
