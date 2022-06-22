// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@rari-capital/solmate/src/utils/ReentrancyGuard.sol";
import "../core/TribeRoles.sol";
import "../refs/CoreRef.sol";
import "../pcv/IPCVDeposit.sol";
import "./IPCVSentinel.sol";
import "./IGuard.sol";

/**
 * @title PCV Sentinel
 * @dev the PCV Sentinel should be granted the role Guardian
 * @notice The PCV Sentinel is a automated extension of the Guardian.
 * The Guardian can add Guards to the PCV Sentinel. Guards run checks
 * and provide addresses and calldata for the Sentinel to run, if needed.
 */
contract PCVSentinel is IPCVSentinel, CoreRef, ReentrancyGuard {
    using EnumerableSet for EnumerableSet.AddressSet;

    // The set of all guards
    EnumerableSet.AddressSet private guards;

    /**
     * @notice Creates a PCV Sentinel with no guards
     * @param _core the Tribe core address
     */
    constructor(address _core) CoreRef(_core) {}

    // ---------- Read-Only API ----------

    /**
     * @notice returns whether or not the given address is a guard
     * @param guard the address to check
     */
    function isGuard(address guard) external view override returns (bool) {
        return guards.contains(guard);
    }

    /**
     * @notice returns a list of all guards
     */
    function allGuards() external view override returns (address[] memory all) {
        all = new address[](guards.length());

        for (uint256 i = 0; i < guards.length(); i++) {
            all[i] = guards.at(i);
        }

        return all;
    }

    // ---------- Governor-or-Admin-Or-Guardian-Only State-Changing API ----------

    /**
     * @notice adds a guard contract to the PCV Sentinel
     * @param guard the guard-contract to add
     */
    function knight(address guard) external override hasAnyOfTwoRoles(TribeRoles.GUARDIAN, TribeRoles.GOVERNOR) {
        guards.add(guard);

        // Inform the kingdom of this glorious news
        emit GuardAdded(guard);
    }

    /**
     * @notice removes a guard
     * @param traitor the guard-contract to remove
     */
    function slay(address traitor) external override hasAnyOfTwoRoles(TribeRoles.GUARDIAN, TribeRoles.GOVERNOR) {
        guards.remove(traitor);

        // Inform the kingdom of this sudden and inevitable betrayal
        emit GuardRemoved(traitor);
    }

    // ---------- Public State-Changing API ----------

    /**
     * @notice checks the guard and runs its protec actions if needed
     * @param guard the guard to activate
     */
    function protec(address guard) external override nonReentrant {
        require(guards.contains(guard), "Guard does not exist.");
        require(IGuard(guard).check(), "No need to protec.");

        (address[] memory targets, bytes[] memory calldatas, uint256[] memory values) = IGuard(guard)
            .getProtecActions();

        for (uint256 i = 0; i < targets.length; i++) {
            require(targets[i] != address(this), "Cannot target self.");
            require(address(this).balance >= values[i], "Insufficient ETH.");
            (bool success, bytes memory returndata) = targets[i].call{value: values[i]}(calldatas[i]);
            Address.verifyCallResult(success, returndata, "Guard sub-action failed with empty error message.");
        }

        emit Protected(guard);
    }

    /**
     * @dev receive() and fallback() have been added and made payable for cases where the contract
     * needs to be able to receive eth as part of an operation - such as receiving an incentivization
     * (in eth) from a contract as part of operation. For similar (and not unlikely) edge cases,
     * the contract also has the capability of sending eth inside when instructed by a guard to do so.
     */
    receive() external payable {}

    fallback() external payable {}
}
