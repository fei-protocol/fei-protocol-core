// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
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
contract PCVSentinel is IPCVSentinel, CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;

    // The set of all guards
    EnumerableSet.AddressSet private guards;

    constructor(
        address _core
    ) CoreRef(_core) {
        _setContractAdminRole(keccak256("PCV_SENTINEL_ADMIN_ROLE"));
    }

    // ---------- Read-Only API ----------

    /**
     * @notice returns whether or not the given address is a guard
     * @param guard the address to check
     */
    function isGuard(address guard) 
        external 
        view
        override
        returns (bool) 
    {
        return guards.contains(guard);
    }

    /**
     * @notice returns a list of all guards
     */
    function allGuards() 
        external
        view
        override
        returns (address[] memory all) 
    {
        all = new address[](guards.length());

        for (uint i = 0; i < guards.length(); i++) {
            all[i] = guards.at(i);
        }

        return all;
    }

    /**
     * @notice returns the list of all guards that pass their check
     * @dev you *can* use this on-chain if you want, but this is made
     * to be called off-chain to pass into protecManys and not hyper-efficient
     */
    function checkAll()
        external 
        view
        override 
        returns (address[] memory) 
    {
        uint256 numGuardsWhoCanProtec = 0;
        bool[] memory guardChecks = new bool[](guards.length());

        for (uint256 i=0; i<guards.length(); i++) {
            if(IGuard(guards.at(i)).check()) {
                guardChecks[i] = true;
                numGuardsWhoCanProtec++;
            }
        }

        address[] memory guardsWhoCanProtec = new address[](numGuardsWhoCanProtec);

        for (uint256 i=0; i<guards.length(); i++) {
            if(guardChecks[i]) {
                numGuardsWhoCanProtec--;
                guardsWhoCanProtec[numGuardsWhoCanProtec] = guards.at(i);
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
        isGovernorOrGuardianOrAdmin
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
        isGovernorOrGuardianOrAdmin
    {
        guards.remove(traitor);

        // Inform the kingdom of this sudden and inevitable betrayal
        emit GuardRemoved(traitor);
    }

    // ---------- Public State-Changing API ----------

    /**
     * @notice checks the guard and runs its protec actions if needed
     * @param guard the guard to activate
     */
    function protec(address guard) 
        external
        override
    {
        require(guards.contains(guard), "Guard does not exist.");

        bool needsProtec = IGuard(guard).check();

        if (needsProtec) {
            (address[] memory targets, bytes[] memory calldatas) = IGuard(guard).getProtecActions();

            for(uint256 i=0; i<targets.length; i++) {
                require(targets[i] != address(this), "Nyeh!");
                (bool success, bytes memory data) = targets[i].call(calldatas[i]);
                require(success, string(data)); // Fail this call if any of the sub-calls fail
            }

            emit Protected(guard);
        } else {
            revert("No need to protec.");
        }
    }

    /**
     * @notice activate many guards
     * @dev we use (optional) try-catch here in case any guards fail, this could be the case
     * if something changes before the transaction hits the chain\
     * @param allowFailure whether or not the entire transaction should revert on failure
     * @param whichGuards the guards to try to activate
     */
    function protecMany(bool allowFailure, address[] calldata whichGuards)
        public 
        override
    {
        for(uint256 i=0; i<whichGuards.length; i++) {
            if (allowFailure) {
                try this.protec(whichGuards[i]) {
                    // the emit happens in protec
                } catch {
                    emit ProtecFailure(whichGuards[i]);
                }
            } else {
                this.protec(whichGuards[i]);
            }
        }
    }
}