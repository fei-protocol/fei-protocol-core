// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./Timed.sol";
import "./LinearTokenTimelock.sol";
import "../refs/CoreRef.sol";

/// @title Governance-Controlled Linear Token Timelock
/// @notice there will be one of these for FEI and one of these for Tribe
/// The duration is dynamically calculated at contract deploykment time so that
/// the end time is the same as the old timelock.
contract GovernanceTimelock is CoreRef, LinearTokenTimelock {

    // fei labs multisig (same as old timelock)
    address constant public BENEFICIARY = address(0xB8f482539F2d3Ae2C9ea6076894df36D1f632775);
    address constant public OLD_TIMELOCK = address(0x7D809969f6A04777F0A87FF94B57E56078E5fE0F);

    // same as old timelock, calculated from start time + duration
    uint256 constant public END_TIME = 1743053422;

    constructor(
        address _core,
        address _lockedToken
    ) CoreRef(_core) LinearTokenTimelock(
        BENEFICIARY,
        END_TIME - block.timestamp,
        _lockedToken
    ) {
        require(_lockedToken != address(0x0), "lockedToken cannot be the zero address");
    }

    /// @notice unlock override to beneficiary of timelock
    function unlockLiquidity() external onlyGovernor {
        _release(beneficiary, totalToken());
    }
}