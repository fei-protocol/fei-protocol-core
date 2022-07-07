// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ICore} from "../core/ICore.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {IPCVGuardian} from "./IPCVGuardian.sol";
import {IPCVDeposit} from "./IPCVDeposit.sol";
import {CoreRefPauseableLib} from "../libs/CoreRefPauseableLib.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {Constants} from "../Constants.sol";

contract PCVGuardian is IPCVGuardian, CoreRef {
    using CoreRefPauseableLib for address;
    using EnumerableSet for EnumerableSet.AddressSet;

    // If an address is in this set, it's a safe address to withdraw to
    EnumerableSet.AddressSet private safeAddresses;

    constructor(address _core, address[] memory _safeAddresses) CoreRef(_core) {
        for (uint256 i = 0; i < _safeAddresses.length; i++) {
            _setSafeAddress(_safeAddresses[i]);
        }
    }

    // ---------- Read-Only API ----------

    /// @notice returns true if the the provided address is a valid destination to withdraw funds to
    /// @param pcvDeposit the address to check
    function isSafeAddress(address pcvDeposit) public view override returns (bool) {
        return safeAddresses.contains(pcvDeposit);
    }

    /// @notice returns all safe addresses
    function getSafeAddresses() public view override returns (address[] memory) {
        return safeAddresses.values();
    }

    // ---------- GOVERNOR-or-PCV_GUARDIAN_ADMIN-Only State-Changing API ----------

    /// @notice governor-only method to set an address as "safe" to withdraw funds to
    /// @param pcvDeposit the address to set as safe
    function setSafeAddress(address pcvDeposit)
        external
        override
        hasAnyOfTwoRoles(TribeRoles.PCV_GUARDIAN_ADMIN, TribeRoles.GOVERNOR)
    {
        _setSafeAddress(pcvDeposit);
    }

    /// @notice batch version of setSafeAddress
    /// @param _safeAddresses the addresses to set as safe, as calldata
    function setSafeAddresses(address[] calldata _safeAddresses)
        external
        override
        hasAnyOfTwoRoles(TribeRoles.PCV_GUARDIAN_ADMIN, TribeRoles.GOVERNOR)
    {
        require(_safeAddresses.length != 0, "PCVGuardian: empty");
        for (uint256 i = 0; i < _safeAddresses.length; i++) {
            _setSafeAddress(_safeAddresses[i]);
        }
    }

    // ---------- GOVERNOR-or-PCV_GUARDIAN_ADMIN-Or-GUARDIAN-Only State-Changing API ----------

    /// @notice governor-or-guardian-only method to un-set an address as "safe" to withdraw funds to
    /// @param pcvDeposit the address to un-set as safe
    function unsetSafeAddress(address pcvDeposit)
        external
        override
        hasAnyOfThreeRoles(TribeRoles.PCV_GUARDIAN_ADMIN, TribeRoles.GUARDIAN, TribeRoles.GOVERNOR)
    {
        _unsetSafeAddress(pcvDeposit);
    }

    /// @notice batch version of unsetSafeAddresses
    /// @param _safeAddresses the addresses to un-set as safe
    function unsetSafeAddresses(address[] calldata _safeAddresses)
        external
        override
        hasAnyOfThreeRoles(TribeRoles.PCV_GUARDIAN_ADMIN, TribeRoles.GUARDIAN, TribeRoles.GOVERNOR)
    {
        require(_safeAddresses.length != 0, "PCVGuardian: empty");
        for (uint256 i = 0; i < _safeAddresses.length; i++) {
            _unsetSafeAddress(_safeAddresses[i]);
        }
    }

    /// @notice modifier to factorize the logic in all withdrawals :
    /// - first, ensure the deposit to withdraw from is unpaused
    /// - second, perform withdrawal
    /// - third, re-pause deposit if it was paused
    /// - finally, call pcvDeposit.deposit() if depositAfter = true
    modifier beforeAndAfterWithdrawal(
        address pcvDeposit,
        address safeAddress,
        bool depositAfter
    ) {
        {
            // scoped in this modifier to prevent stack to deep errors & enforce consistent acl
            ICore _core = core();
            require(
                _core.hasRole(TribeRoles.GUARDIAN, msg.sender) ||
                    _core.hasRole(TribeRoles.PCV_SAFE_MOVER_ROLE, msg.sender) ||
                    _core.hasRole(TribeRoles.GOVERNOR, msg.sender),
                "UNAUTHORIZED"
            );
            require(isSafeAddress(safeAddress), "PCVGuardian: address not whitelisted");
        }

        bool paused = pcvDeposit._paused();
        if (paused) {
            pcvDeposit._unpause();
        }

        _;

        if (paused) {
            pcvDeposit._pause();
        }

        if (depositAfter) {
            IPCVDeposit(safeAddress).deposit();
        }
    }

    /// @notice withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount to withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawToSafeAddress(
        address pcvDeposit,
        address safeAddress,
        uint256 amount,
        bool depositAfter
    ) external override beforeAndAfterWithdrawal(pcvDeposit, safeAddress, depositAfter) {
        IPCVDeposit(pcvDeposit).withdraw(safeAddress, amount);
        emit PCVGuardianWithdrawal(pcvDeposit, safeAddress, amount);
    }

    /// @notice withdraw funds from a pcv deposit, by calling the withdraw() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param basisPoints the percent in basis points [1-10000] if the deposit's balance to withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawRatioToSafeAddress(
        address pcvDeposit,
        address safeAddress,
        uint256 basisPoints,
        bool depositAfter
    ) external override beforeAndAfterWithdrawal(pcvDeposit, safeAddress, depositAfter) {
        require(basisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PCVGuardian: basisPoints too high");
        uint256 amount = (IPCVDeposit(pcvDeposit).balance() * basisPoints) / Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "PCVGuardian: no value to withdraw");

        IPCVDeposit(pcvDeposit).withdraw(safeAddress, amount);
        emit PCVGuardianWithdrawal(pcvDeposit, safeAddress, amount);
    }

    /// @notice withdraw funds from a pcv deposit, by calling the withdrawETH() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount of tokens to withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawETHToSafeAddress(
        address pcvDeposit,
        address payable safeAddress,
        uint256 amount,
        bool depositAfter
    ) external override beforeAndAfterWithdrawal(pcvDeposit, safeAddress, depositAfter) {
        IPCVDeposit(pcvDeposit).withdrawETH(safeAddress, amount);
        emit PCVGuardianETHWithdrawal(pcvDeposit, safeAddress, amount);
    }

    /// @notice withdraw funds from a pcv deposit, by calling the withdrawETH() method on it
    /// @param pcvDeposit the address of the pcv deposit contract
    /// @param safeAddress the destination address to withdraw to
    /// @param basisPoints the percent in basis points [1-10000] if the deposit's balance to withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawETHRatioToSafeAddress(
        address pcvDeposit,
        address payable safeAddress,
        uint256 basisPoints,
        bool depositAfter
    ) external override beforeAndAfterWithdrawal(pcvDeposit, safeAddress, depositAfter) {
        require(basisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PCVGuardian: basisPoints too high");
        uint256 amount = (pcvDeposit.balance * basisPoints) / Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "PCVGuardian: no value to withdraw");

        IPCVDeposit(pcvDeposit).withdrawETH(safeAddress, amount);
        emit PCVGuardianETHWithdrawal(pcvDeposit, safeAddress, amount);
    }

    /// @notice withdraw funds from a pcv deposit, by calling the withdrawERC20() method on it
    /// @param pcvDeposit the deposit to pull funds from
    /// @param safeAddress the destination address to withdraw to
    /// @param amount the amount of funds to withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawERC20ToSafeAddress(
        address pcvDeposit,
        address safeAddress,
        address token,
        uint256 amount,
        bool depositAfter
    ) external override beforeAndAfterWithdrawal(pcvDeposit, safeAddress, depositAfter) {
        IPCVDeposit(pcvDeposit).withdrawERC20(token, safeAddress, amount);
        emit PCVGuardianERC20Withdrawal(pcvDeposit, safeAddress, token, amount);
    }

    /// @notice withdraw funds from a pcv deposit, by calling the withdrawERC20() method on it
    /// @param pcvDeposit the deposit to pull funds from
    /// @param safeAddress the destination address to withdraw to
    /// @param basisPoints the percent in basis points [1-10000] if the deposit's balance to withdraw
    /// @param depositAfter if true, attempts to deposit to the target PCV deposit
    function withdrawERC20RatioToSafeAddress(
        address pcvDeposit,
        address safeAddress,
        address token,
        uint256 basisPoints,
        bool depositAfter
    ) external override beforeAndAfterWithdrawal(pcvDeposit, safeAddress, depositAfter) {
        require(basisPoints <= Constants.BASIS_POINTS_GRANULARITY, "PCVGuardian: basisPoints too high");
        uint256 amount = (IERC20(token).balanceOf(pcvDeposit) * basisPoints) / Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "PCVGuardian: no value to withdraw");

        IPCVDeposit(pcvDeposit).withdrawERC20(token, safeAddress, amount);
        emit PCVGuardianERC20Withdrawal(pcvDeposit, safeAddress, token, amount);
    }

    // ---------- Internal Functions ----------

    function _setSafeAddress(address anAddress) internal {
        require(safeAddresses.add(anAddress), "PCVGuardian: already a safe address");
        emit SafeAddressAdded(anAddress);
    }

    function _unsetSafeAddress(address anAddress) internal {
        require(safeAddresses.remove(anAddress), "PCVGuardian: not a safe address");
        emit SafeAddressRemoved(anAddress);
    }
}
