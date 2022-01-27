// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title IPCVSentinel
/// @notice an interface for defining how the PCVSentinel functions
/// @dev any implementation of this contract should be granted the roles of Guardian and PCVController in order to work correctly
interface IPCVSentinel {
    // ---------- Events ----------
    event ContractProtected(address indexed protectedContract, address indexed guard);
    event ContractGuardAdded(address indexed protectedContract, address indexed guard);
    event ContractGuardRemoved(address indexed protectedContract, address indexed guard);

    // ---------- Read-Only API ----------
    function getGuardedContracts() external view returns (address[] memory guarded);
    function getAllGuards() external view returns (address[] memory allGuards);
    function getContractsAndGuards() external view returns (address[][] memory contractsAndGuards);

    // ---------- Governor-Only State-Changing API ----------
    function knight(address guard, address guardedContract) external;

    // ---------- Governor-Or-Admin-Or-Guardian-Only State-Changing API ----------
    function slay(address traitor) external;

    // ---------- Public State-Changing API ----------
    function protec(address guardedContract) external returns (bool activated);
    function activateGuard(address guardAddress) external returns (bool);
    function activateAllGuards() external payable returns (bool activated, address[] memory activatedGuards);
}