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
        address _core,
        address[] calldata _safeAddresses
    ) CoreRef(_core) {
        _setContractAdminRole(keccak256("PCV_GUARDIAN_ADMIN_ROLE"));

        for(uint256 i=0; i<_safeAddresses.length; i++) {
            _setSafeAddress(_safeAddresses[i]);
        }
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

    // ---------- Governor-or-Admin-Only State-Changing API ----------

    /// @notice governor-only method to set an address as "safe" to withdraw funds to
    /// @param anAddress the address to set as safe
    function setSafeAddress(address pcvDeposit) external override onlyGovernorOrAdmin() {
        _setSafeAddress(pcvDeposit);
    }

    /// @notice batch version of setSafeAddress
    /// @param safeAddresses the addresses to set as safe, as calldata
    function setSafeAddresses(address[] calldata safeAddresses) external override onlyGovernorOrAdmin() {
        for(uint256 i=0; i<safeAddresses.length; i++) {
            _setSafeAddress(safeAddresses[i]);
        }
    }

    // ---------- Governor-or-Admin-Or-Guardian-Only State-Changing API ----------

    /// @notice governor-or-guardian-only method to un-set an address as "safe" to withdraw funds to
    /// @param pcvDeposit the address to un-set as safe
    function unsetSafeAddress(address pcvDeposit) external override isGovernorOrGuardianOrAdmin() {
        _unsetSafeAddress(pcvDeposit);
    }

    /// @notice batch version of unsetSafeAddresses
    /// @param safeAddresses the addresses to un-set as safe
    function unsetSafeAddresses(address[] calldata safeAddresses) external override isGovernorOrGuardianOrAdmin() {
        for(uint256 i=0; i<safeAddresses.length; i++) {
            _unsetSafeAddress(safeAddresses[i]);
        }
    }

    /// @notice governor-or-guardian-only method to withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount to withdraw
    /// @param pauseAfter if true, the pcv contract will be paused after the withdraw
    function withdrawToSafeAddress(address pcvDeposit, address safeAddress, uint256 amount, bool pauseAfter) external override isGovernorOrGuardianOrAdmin() {
        require(isSafeAddress(safeAddress), "Provided address is not a safe address!");

        if (ICoreRef(pcvDeposii).isPaused()) {
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
    function withdrawETHToSafeAddress(address pcvDeposit, address payable safeAddress, uint256 amount, bool pauseAfter) external override isGovernorOrGuardianOrAdmin() {
        require(isSafeAddress(safeAddress), "Provided address is not a safe address!");

        if (ICoreRef(pcvDeposit).isPaused()) {
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
    function withdrawERC20ToSafeAddress(address pcvDeposit, address safeAddress, address token, uint256 amount, bool unpauseBefore, bool pauseAfter) external override isGovernorOrGuardianOrAdmin() {
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

    // ---------- Internal Functions ----------

    function _setSafeAddress(address anAddress) internal {
        safeAddresses.add(anAddress);
        emit SafeAddressAdded(anAddress);
    }

    function _unsetSafeAddress(address anAddress) internal {
        safeAddresses.remove(anAddress);
        emit SafeAddressRemoved(anAddress);
    }
}