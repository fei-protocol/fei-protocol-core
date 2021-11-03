// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../refs/CoreRef.sol";
import "./IPCVGuardian.sol";
import "./IPCVDeposit.sol";

contract PCVGuardian is IPCVGuardian, CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;

    // If an address is in this set, it's a safe address to withdraw to
    EnumerableSet.AddressSet private safeAddresses;

    constructor(
        address _core
    ) CoreRef(_core) {

    }

    // ---------- Read-Only API ----------

    /// @notice returns true if the the provided address is a valid destination to withdraw funds to
    /// @param anAddress the address to check
    function isSafeAddress(address anAddress) public view override returns (bool) {
        return safeAddresses.contains(anAddress);
    }

    /// @notice returns all safe addresses
    function getSafeAddresses() public view override returns (address[] memory) {
        return safeAddresses.values();
    }

    // ---------- Governor-Only State-Changing API ----------

    /// @notice governor-only method to set an address as "safe" to withdraw funds to
    /// @param anAddress the address to set as safe
    function setSafeAddress(address anAddress) external override onlyGovernor() {
        safeAddresses.add(anAddress);
        emit SafeAddressAdded(anAddress);
    }

    // ---------- Governor-or-Guardian-Only State-Changing API ----------

    /// @notice governor-or-guardian-only method to un-set an address as "safe" to withdraw funds to
    /// @param anAddress the address to un-set as safe
    function unsetSafeAddress(address anAddress) external override onlyGuardianOrGovernor() {
        safeAddresses.remove(anAddress);
        emit SafeAddressRemoved(anAddress);
    }

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount to withdraw
    /// @param unpauseBefore if true, the pcv contract will be unpaused before the withdraw
    /// @param pauseAfter if true, the pcv contract will be paused after the withdraw
    function withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint amount, bool unpauseBefore, bool pauseAfter) external override onlyGuardianOrGovernor() {
        require(isSafeAddress(safeAddress), "Provided address is not a safe address!");

        if (unpauseBefore) {
            ICoreRef(pcvDeposit).unpause();
        }

        IPCVDeposit(pcvDeposit).withdraw(safeAddress, amount);

        if (pauseAfter) {
            ICoreRef(pcvDeposit).pause();
        }

        emit PCVGuardianWithdrawal(pcvDeposit, safeAddress, amount);
    }

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount of tokens to withdraw
    /// @param unpauseBefore if true, the pcv contract will be unpaused before the withdraw
    /// @param pauseAfter if true, the pcv contract will be paused after the withdraw
    function withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint amount, bool unpauseBefore, bool pauseAfter) external override onlyGuardianOrGovernor() {
        require(isSafeAddress(safeAddress), "Provided address is not a safe address!");

        if (unpauseBefore) {
            ICoreRef(pcvDeposit).unpause();
        }

        IPCVDeposit(pcvDeposit).withdrawETH(safeAddress, amount);

        if (pauseAfter) {
            ICoreRef(pcvDeposit).pause();
        }

        emit PCVGuardianETHWithdrawal(pcvDeposit, safeAddress, amount);
    }

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the deposit to pull funds from
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount of funds to withdraw
    /// @param unpauseBefore whether to unpause the pcv before withdrawing
    /// @param pauseAfter whether to pause the pcv after withdrawing
    function withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint amount, bool unpauseBefore, bool pauseAfter) external override onlyGuardianOrGovernor() {
        require(isSafeAddress(safeAddress), "Provided address is not a safe address!");

        if (unpauseBefore) {
            ICoreRef(pcvDeposit).unpause();
        }

        IPCVDeposit(pcvDeposit).withdrawERC20(token, safeAddress, amount);

        if (pauseAfter) {
            ICoreRef(pcvDeposit).pause();
        }

        emit PCVGuardianERC20Withdrawal(pcvDeposit, safeAddress, token, amount);
    }
}