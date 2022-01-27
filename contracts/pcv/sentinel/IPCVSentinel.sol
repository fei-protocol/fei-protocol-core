// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title IPCVSentinel
/// @notice an interface for defining how the PCVSentinel functions
/// @dev any implementation of this contract should be granted the roles of Guardian and PCVController in order to work correctly
interface IPCVSentinel {
    // ---------- Events ----------
    event Protected(address indexed guard);
    event ProtecFailure(address indexed guard);
    event GuardAdded(address indexed guard);
    event GuardRemoved(address indexed guard);

    // ---------- Public Read-Only API ----------
    function isGuard(address guard) external view returns (bool);
    function allGuards() external view returns (address[] memory all);
    function checkAll() external view returns(address[] memory guards);

    // ---------- Governor-Only State-Changing API ----------
    function knight(address guard) external;

    // ---------- Governor-Or-Admin-Or-Guardian-Only State-Changing API ----------
    function slay(address traitor) external;

    // ---------- Public State-Changing API ----------
    function protec(address guard) external;
    function protecMany(address[] memory guards) external;
}