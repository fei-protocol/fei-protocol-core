// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title IPCVGuardian
/// @notice an interface for defining how the PCVGuardian functions
/// @dev any implementation of this contract should be granted the roles of Guardian and PCVController in order to work correctly
interface IPCVGuardian {
    // ---------- Events ----------
    event SafeAddressAdded(address indexed safeAddress);

    event SafeAddressRemoved(address indexed safeAddress);

    event PCVGuardianWithdrawal(address indexed pcvDeposit, address indexed destination, uint256 amount);

    event PCVGuardianETHWithdrawal(address indexed pcvDeposit, address indexed destination, uint256 amount);

    event PCVGuardianERC20Withdrawal(
        address indexed pcvDeposit,
        address indexed destination,
        address indexed token,
        uint256 amount
    );

    // ---------- Read-Only API ----------

    /// @notice returns true if the the provided address is a valid destination to withdraw funds to
    /// @param pcvDeposit the address to check
    function isSafeAddress(address pcvDeposit) external view returns (bool);

    /// @notice returns all safe addresses
    function getSafeAddresses() external view returns (address[] memory);

    // ---------- Governor-Only State-Changing API ----------

    /// @notice governor-only method to set an address as "safe" to withdraw funds to
    /// @param pcvDeposit the address to set as safe
    function setSafeAddress(address pcvDeposit) external;

    /// @notice batch version of setSafeAddress
    /// @param safeAddresses the addresses to set as safe, as calldata
    function setSafeAddresses(address[] calldata safeAddresses) external;

    // ---------- Governor-or-Guardian-Only State-Changing API ----------

    /// @notice governor-or-guardian-only method to un-set an address as "safe" to withdraw funds to
    /// @param pcvDeposit the address to un-set as safe
    function unsetSafeAddress(address pcvDeposit) external;

    /// @notice batch version of unsetSafeAddresses
    /// @param safeAddresses the addresses to un-set as safe
    function unsetSafeAddresses(address[] calldata safeAddresses) external;

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount to withdraw
    /// @param pauseAfter if true, the pcv contract will be paused after the withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawToSafeAddress(
        address pcvDeposit,
        address safeAddress,
        uint256 amount,
        bool pauseAfter,
        bool depositAfter
    ) external;

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount of tokens to withdraw
    /// @param pauseAfter if true, the pcv contract will be paused after the withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawETHToSafeAddress(
        address pcvDeposit,
        address payable safeAddress,
        uint256 amount,
        bool pauseAfter,
        bool depositAfter
    ) external;

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the deposit to pull funds from
    /// @param safeAddress the destination address to withdraw to
    /// @param token the token to withdraw
    /// @param amount the amount of funds to withdraw
    /// @param pauseAfter whether to pause the pcv after withdrawing
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawERC20ToSafeAddress(
        address pcvDeposit,
        address safeAddress,
        address token,
        uint256 amount,
        bool pauseAfter,
        bool depositAfter
    ) external;
}
