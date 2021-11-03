// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title IPCVGuardian
/// @notice an interface for defining how the PCVGuardian functions
/// @dev any implementation of this contract should be granted the roles of Guardian and PCVController in order to work correctly
interface IPCVGuardian {
    // ---------- Events ----------
    event SafeAddressAdded(
        address indexed anAddress
    );

    event SafeAddressRemoved(
        address indexed anAddress
    );

    event PCVGuardianWithdrawal(
        address indexed pcvDeposit, 
        address indexed destination, 
        uint amount
    ); 

    event PCVGuardianETHWithdrawal(
        address indexed pcvDeposit, 
        address indexed destination, 
        uint amount
    );

    event PCVGuardianERC20Withdrawal(
        address indexed pcvDeposit, 
        address indexed destination, 
        uint amount
    );

    // ---------- Read-Only API ----------

    /// @notice returns true if the the provided address is a valid destination to withdraw funds to
    /// @param anAddress the address to check
    function isSafeAddress(address anAddress) external view returns (bool);

    // ---------- Governor-Only State-Changing API ----------

    /// @notice governor-only method to set an address as "safe" to withdraw funds to
    /// @param anAddress the address to set as safe
    function setSafeAddress(address anAddress) external;

    // ---------- Governor-or-Guardian-Only State-Changing API ----------

    /// @notice governor-or-guardian-only method to un-set an address as "safe" to withdraw funds to
    /// @param anAddress the address to un-set as safe
    function unsetSafeAddress(address anAddress) external;

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount to withdraw
    /// @param unpauseBefore if true, the pcv contract will be unpaused before the withdraw
    /// @param pauseAfter if true, the pcv contract will be paused after the withdraw
    function withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint amount, bool unpauseBefore, bool pauseAfter) external;

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount of tokens to withdraw
    /// @param unpauseBefore if true, the pcv contract will be unpaused before the withdraw
    /// @param pauseAfter if true, the pcv contract will be paused after the withdraw
    function withdrawETHToSafeAddress(address pcvDeposit, address safeAddress, uint amount, bool unpauseBefore, bool pauseAfter) external;

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the deposit to pull funds from
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount of funds to withdraw
    /// @param unpauseBefore whether to unpause the pcv before withdrawing
    /// @param pauseAfter whether to pause the pcv after withdrawing
    function withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, uint amount, bool unpauseBefore, bool pauseAfter) external;
}