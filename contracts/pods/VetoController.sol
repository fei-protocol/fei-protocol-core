// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IPodFactory} from "./IPodFactory.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {TribeRoles} from "../core/TribeRoles.sol";

/// @title Pod Veto Controller
/// @notice Exposes veto functionality over the timelock of pods to a configurable set of TribeRoles
/// @dev This contract is intended to be set as a proposer on the timelock of a pod. This gives it the ability
///      to cancel a proposal. The contract introduced to allow TribeRoles to be added and revoked from
///      vetoing pods
contract VetoController is CoreRef {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /// @notice PodFactory that was used to create pods
    IPodFactory private podFactory;

    constructor(address _core, address _podFactory) CoreRef(_core) {
        podFactory = IPodFactory(_podFactory);
    }

    event VetoTimelock(uint256 indexed podId, address indexed timelock);
    event GrantVetoPermission(
        uint256 indexed podId,
        address indexed timelock,
        bytes32 tribeRole
    );
    event RevokeVetoPermission(
        uint256 indexed podId,
        address indexed timelock,
        bytes32 tribeRole
    );

    /// @notice Mapping between a pod timelock and the TribeRoles that are allowed to veto transactions on it
    mapping(address => EnumerableSet.Bytes32Set) private podVetoRoles;

    /// @notice Get all the TribeRoles that have veto power over a pod
    function getPodVetoRoles(uint256 _podId)
        external
        view
        returns (bytes32[] memory)
    {
        address timelock = podFactory.getPodTimelock(_podId);

        if (podVetoRoles[timelock].length() == 0) {
            bytes32[] memory empty = new bytes32[](0);
            return empty;
        }
        return podVetoRoles[timelock].values();
    }

    /// @notice Grant veto permission over a particular pod to a TribeRole
    /// @dev Permissioned to the GOVERNOR, ROLE_ADMIN and GUARDIAN. Used to allow particular TribeRoles
    ///      to be granted veto ability over pods
    function grantVetoPermission(uint256 _podId, bytes32 role)
        public
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GUARDIAN
        )
    {
        address timelock = podFactory.getPodTimelock(_podId);
        podVetoRoles[timelock].add(role);
        emit GrantVetoPermission(_podId, timelock, role);
    }

    /// @notice Revoke a particular TribeRole's veto permission over a pod
    function revokeVetoPermission(uint256 _podId, bytes32 role)
        public
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GUARDIAN
        )
    {
        address timelock = podFactory.getPodTimelock(_podId);
        podVetoRoles[timelock].remove(role);
        emit RevokeVetoPermission(_podId, timelock, role);
    }

    /// @notice Batch grant veto permission
    function batchGrantVetoPermission(
        uint256[] memory _podIds,
        bytes32[] memory roles
    ) external {
        for (uint256 i = 0; i < roles.length; i += 1) {
            grantVetoPermission(_podIds[i], roles[i]);
        }
    }

    /// @notice Batch revoke veto permission
    function batchRevokeVetoPermission(
        uint256[] memory _podIds,
        bytes32[] memory roles
    ) external {
        for (uint256 i = 0; i < roles.length; i += 1) {
            revokeVetoPermission(_podIds[i], roles[i]);
        }
    }

    /// @notice Veto a proposal in a pod timelock
    function veto(uint256 _podId, bytes32 proposalId) external {
        address timelock = podFactory.getPodTimelock(_podId);

        validateVetoPermission(timelock, msg.sender);

        emit VetoTimelock(_podId, timelock);
        TimelockController(payable(timelock)).cancel(proposalId);
    }

    /// @notice Validate that the caller has permission to veto a proposal in a pod timelock
    function validateVetoPermission(address _timelock, address _caller)
        internal
        view
    {
        bool hasPermission = false;
        uint256 vetoRolesLength = podVetoRoles[_timelock].length();

        for (uint256 i = 0; i < vetoRolesLength; i += 1) {
            bytes32 role = podVetoRoles[_timelock].at(i);

            if (core().hasRole(role, _caller)) {
                hasPermission = true;
                return;
            }
        }
        require(hasPermission, "UNAUTHORISED_VETO");
    }
}
