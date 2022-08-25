// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {LinearTokenTimelock} from "./LinearTokenTimelock.sol";
import {CoreRef} from "../refs/CoreRef.sol";

/// @title LinearUnlockTimelock
/// @notice Linear token timelock with an onlyGovernor unlockLiquidity() method
contract LinearUnlockTimelock is LinearTokenTimelock, CoreRef {
    constructor(
        address _core,
        address _beneficiary,
        uint256 _duration,
        address _lockedToken,
        uint256 _cliffDuration,
        address _clawbackAdmin,
        uint256 _startTime
    )
        LinearTokenTimelock(_beneficiary, _duration, _lockedToken, _cliffDuration, _clawbackAdmin, _startTime)
        CoreRef(_core)
    {}

    /// @notice Unlock the liquidity held by the timelock
    /// @dev Restricted to onlyGovernor
    function unlockLiquidity() external onlyGovernor {
        _release(beneficiary, totalToken());
    }
}
