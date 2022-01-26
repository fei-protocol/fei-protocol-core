// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./WeightedBalancerPoolManager.sol";

/// @title WeightedBalancerPoolManagerBase
/// @notice the simplest contract implementation that inherits the abstract
/// WeightedBalancerPoolManager class.
/// This contract  manages a Balancer WeightedPool (including LBP).
/// Exposes the governable methods to Fei Governors or admins
contract WeightedBalancerPoolManagerBase is WeightedBalancerPoolManager {

    constructor(address _core) WeightedBalancerPoolManager() CoreRef(_core) {}
}
