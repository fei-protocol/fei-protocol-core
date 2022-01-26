// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "../../refs/CoreRef.sol";
import "./IPCVSentinel.sol";
import "../IPCVDeposit.sol";
import "../../libs/CoreRefPauseableLib.sol";
import "./IGuard.sol";

/**
 * @title PCV Sentinel
 * @dev the PCV Sentinel should be granted the roles Guardian and PCVController
 * @notice The PCV Sentinel is a general-purpose protector with extremely flexible powers.
 * On its own, it is useless; it must be paired with "guards". Guards are deployed smart contracts
 * that each know how to protect a specific contract (typically a pcv deposit), and know what actions
 * to take in order to protect their contract. Each protected contract can have many guards; each guard
 * is assigned to a single smart contract. The PCV Sentinel delegates (via delegatecall) to each guard
 * to perform actions with the PCVSentinel's powers (guardian and pcv controller). The DAO
 * can choose to add or remove guards to the contract. Each guard should be THOUROUGLY reviewed.
 * Anyone can activate guards, allowing the Sentinel to act instantly in time of need.
 */
contract PCVSentinel is IPCVSentinel, CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;

    // Each contract can have many guards
    // But each guard can guard only one contract
    EnumerableSet.AddressSet private guardedContracts;
    EnumerableSet.AddressSet private guards;

    // This mapping gives us the contract to which the supplied guard applies to
    mapping(address => address) public guardToContract;

    // This mapping gives us all of the guards of the supplied contract
    mapping(address => EnumerableSet.AddressSet) private contractToGuards;

    constructor(
        address _core
    ) CoreRef(_core) {
        _setContractAdminRole(keccak256("PCV_SENTINEL_ADMIN_ROLE"));
    }

    // ---------- Read-Only API ----------

    /**
     * @notice Get all contracts that are guarded
     * @return guarded an array of guarded contracts
     */
    function getGuardedContracts() external override view returns (address[] memory guarded) {
        guarded = new address[](guardedContracts.length());
        for (uint i = 0; i < guardedContracts.length(); i++) {
            guarded[i] = guardedContracts.at(i);
        }

        return guarded;
    }

    /**
     * @notice Get all guards
     * @return allGuards an array of all guards
     */
    function getAllGuards() external override view returns (address[] memory allGuards) {
        allGuards = new address[](guards.length());
        for (uint i = 0; i < guards.length(); i++) {
            allGuards[i] = guards.at(i);
        }

        return allGuards;
    }

    /**
     * @notice Get all contracts and their guards
     * @return contractsAndGuards a 2-dimensional array of contracts and their guards
     */
    function getContractsAndGuards() external override view returns (address[][] memory contractsAndGuards) {
        contractsAndGuards = new address[][](guardedContracts.length());
        for (uint i = 0; i < guardedContracts.length(); i++) {
            address guardedContract = guardedContracts.at(i);
            uint256 numGuards = contractToGuards[guardedContract].length();

            address[] memory guardsForContract = new address[](numGuards);

            for (uint j = 0; j < numGuards; j++) {
                guardsForContract[j] = contractToGuards[guardedContract].at(j);
            }

            contractsAndGuards[i] = guardsForContract;
        }

        return contractsAndGuards;
    }

    // ---------- Governor-Only State-Changing API ----------

    /**
     * @notice adds a guard and its associated contract
     * @dev Guards are given the full power of the Guardian and PCVController roles and should be added carefully.
     *      They are activated via delegateCall and will take arbitrary actions on behalf of the Sentinel.
     *      Tread carefully; with great power comes great responsibility.
     * @param squire the guard-contract to add
     * @param guardedContract the contract that the guard protects
     */
    function knightTheWorthy(address squire, address guardedContract) external override onlyGovernor {
        // .add on addressSet is a no-op if the address is already in the set
        guardedContracts.add(guardedContract);
        guards.add(squire);

        // Assign the newly appointed knight to his fief (contract)
        guardToContract[squire] = guardedContract;

        // Let the fief know that it has a new guard
        contractToGuards[guardedContract].add(squire);

        // Inform the kingdom of this glorious news
        emit ContractGuardAdded(guardedContract, squire);
    }

    // ---------- Governor-or-Admin-Or-Guardian-Only State-Changing API ----------

    /**
     * @notice removes a guard
     * @param traitor the guard-contract to remove
     */
    function slayTraitor(address traitor) external override isGovernorOrGuardianOrAdmin {
        /// Find out which address the traitor was guarding
        address guardedContract = guardToContract[traitor];

        // Unassign the guard from the global registry
        guards.remove(traitor);

        // Unassign the guard from his contract
        guardToContract[traitor] = address(0x0);
        
        // Remove the guard from the list of guards that his contract has
        contractToGuards[guardedContract].remove(traitor);

        // Inform the kingdom of this sudden and inevitable betrayal
        emit ContractGuardRemoved(guardedContract, traitor);
    }

    // Public State-Changing API

    /**
     * @notice Activate all guards for a given contract
     * @param guardedContract the contract for which to activate its guards, if any
     * @return activated true if any guards took action
     */
    function protec(address guardedContract) external payable override returns (bool activated) {
        require(guardedContracts.contains(guardedContract));

        for (uint i = 0; i < contractToGuards[guardedContract].length(); i++) {
            bool thisGuardActivated = activateGuard(contractToGuards[guardedContract].at(i));
            if (thisGuardActivated) {
                emit ContractProtected(guardedContract, contractToGuards[guardedContract].at(i));
            }
            activated = activated || thisGuardActivated;
        }

        return activated;
    }

    /**
     * @notice Activate an individual guard by calling it directly
     * @param guardAddress the address of the guard to activate
     * @return true if the guard took any action
     */
    function activateGuard(address guardAddress) public payable override returns (bool) {
        require(guards.contains(guardAddress));

        // If the guard takes no action, it will revert.
        // Because this is a delegatecall we'll get this as the "success" bool.
        // Beacuse we are delegate-calling, there's no need to try-catch when calling many guards.
        (bool activated,) = guardAddress.delegatecall(abi.encodeWithSignature("checkAndProtec()"));

        return activated;
    }

    /**
     * @notice Activate all guards
     * @return activated true if any guards took action
     * @return activatedGuards the addresses of guards that took action
     * @dev use this function with ethers.js staticCall() to get a list of activate-able guards
     */
    function activateAllGuards() external payable override returns (bool activated, address[] memory activatedGuards) {
        activatedGuards = new address[](guards.length());
        uint numGuardsActivated = 0;

        for (uint i = 0; i < guards.length(); i++) {
            bool thisGuardActivated = activateGuard(guards.at(i));
            if (thisGuardActivated) {
                activatedGuards[numGuardsActivated] = guards.at(i);
                numGuardsActivated++;
                emit ContractProtected(guardToContract[guards.at(i)], guards.at(i));
            }
            activated = activated || thisGuardActivated;
        }

        address[] memory activatedGuardsTruncated = new address[](numGuardsActivated);   

        // Copy the activated guards over to the truncated-size array
        // since you cant resize arrays and dynamic memory arrays dont exist
        for(uint i = 0; i < numGuardsActivated; i++) {
            activatedGuardsTruncated[i] = activatedGuards[i];
        }

        return (activated, activatedGuardsTruncated);
    }
}