// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../../refs/CoreRef.sol";
import "./IPCVSentinel.sol";
import "../IPCVDeposit.sol";
import "../../libs/CoreRefPauseableLib.sol";
import "./IGuard.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

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

    constructor(
        address _core
    ) CoreRef(_core) ReentrancyGuard() {
        _setContractAdminRole(keccak256("PCV_SENTINEL_ADMIN_ROLE"));
    }

    // ---------- Read-Only API ----------

    /**
     * @notice returns the list of all guards that pass their check
     * @dev you *can* use this on-chain if you want, but this is made
     * to be called off-chain to pass into protecManys and not hyper-efficient
     */
    function checkAll() public view returns (address[] memory) {
        uint256 numGuardsCanProtec;

        for (uint256 i=0; i<guards.length(); i++) {
            if(IGuard(guards.at(i)).check()) {
                numGuardsCanProtec++;
            }
        }

        address[] memory guardsWhoCanProtec = new address[](numGuardsCanProtec);

        for (uint256 i=0; i<guards.length(); i++) {
            if(IGuard(guards.at(i)).check()) {
                numGuardsCanProtec--;
                guardsWhoCanProtec[numGuardsCanProtec] = guards.at(i);
            }
        }

        return guardsWhoCanProtec;
    }

    // ---------- Governor-or-Admin-Or-Guardian-Only State-Changing API ----------

    /**
     * @notice adds a guard contract to the PCV Sentinel
     * @param guard the guard-contract to add
     */
    function knight(address guard) 
        external 
        override 
        onlyGuardianOrGovernor
        nonReentrant
    {
        guards.add(guard);

        // Inform the kingdom of this glorious news
        emit GuardAdded(guard);
    }

    /**
     * @notice removes a guard
     * @param traitor the guard-contract to remove
     */
    function slay(address traitor) 
        external 
        override 
        onlyGuardianOrGovernor
        nonReentrant
    {
        guards.remove(traitor);

        // Inform the kingdom of this sudden and inevitable betrayal
        emit GuardRemoved(traitor);
    }

    // ---------- Public State-Changing API ----------

    function protec(address guard) 
        public 
        override
        nonReentrant
    {
        require(guards.contains(guard), "Guard does not exist.");
        (bool needsProtec, address[] targets, bytes[] datas) = IGuard(guard).check();

        if (needsProtec) {
            for(uint256 i=0; i<targets.length; i++) {
                targets[i].call(datas[i]); // Unopinionated about reverts
            }

            emit Protected(guard);
        }
    }

    function protecMany(address[] calldata whichGuards) 
        public 
        override
        nonReentrant
    {
        for(uint256 i=0; i<whichGuards.length; i++) {
            protec(whichGuards[i]);
        }
    }
}