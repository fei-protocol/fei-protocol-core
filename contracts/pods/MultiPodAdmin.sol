// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IMemberToken} from "./orcaInterfaces/IMemberToken.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import "hardhat/console.sol";

/// @title Multiple Pod Admins for Orca pods
/// @notice Expose pod admin functionality from Orca pods to multiple Tribe Roles.
/// @dev This contract is intended to be granted the podAdmin role on a deployed pod. This
///      contract then maintains it's own internal state of additional TribeRoles that it will
///      expose podAdmin actions to.
///      In this way, multiple podAdmins can be added per pod.
contract MultiPodAdmin is CoreRef {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /// @notice Orca membership token for the pods. Handles permissioning pod members
    IMemberToken private immutable memberToken;

    /// @notice Mapping between a podId and all added TribeRoles, which have admin access to that pod
    mapping(uint256 => EnumerableSet.Bytes32Set) private podAdminRoles;

    event GrantPodAdminRole(uint256 indexed podId, bytes32 indexed tribeRole);
    event RevokePodAdminRole(uint256 indexed podId, bytes32 indexed tribeRole);

    /// @notice Validate that a calling address has a TribeRole which has been granted admin functionality
    /// @dev
    // 1. Get all TribeRoles that have been granted admin access to pod
    // 2. Iterate through all these roles, and see if the calling address has one of these roles
    // 3. If so, progress. Otherwise, revert
    modifier onlyPodAdmin(uint256 podId) {
        ICore core = core();

        bool hasAdminRole = false;
        for (uint256 i = 0; i < podAdminRoles[podId].length(); i += 1) {
            bytes32 role = podAdminRoles[podId].at(i);

            if (core.hasRole(role, msg.sender)) {
                hasAdminRole = true;
            }
        }

        if (hasAdminRole) {
            _;
        } else {
            revert("Only pod admin");
        }
    }

    constructor(address _core, address _memberToken) CoreRef(_core) {
        memberToken = IMemberToken(_memberToken);
    }

    /////////////////////////     GETTERS                   ///////////////////////

    /// @notice Get all TribeRoles which have admin access to a pod
    function getPodAdminRoles(uint256 _podId)
        external
        view
        returns (bytes32[] memory)
    {
        if (podAdminRoles[_podId].length() == 0) {
            bytes32[] memory emptyAdmins = new bytes32[](0);
            return emptyAdmins;
        }
        return podAdminRoles[_podId].values();
    }

    /////////////////////////     STATE CHANGING API       ////////////////////////////

    ///// Grant and revoke pod admin functionality to Tribe Roles

    /// @notice Grant a TribeRole admin acces to a pod
    /// @dev Permissioned to the GOVERNOR, ROLE_ADMIN (TribalCouncil). Security Guardian
    ///      not able to add admins
    function grantPodAdminRole(uint256 _podId, bytes32 _tribeRole)
        external
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.ROLE_ADMIN)
    {
        podAdminRoles[_podId].add(_tribeRole);
        emit GrantPodAdminRole(_podId, _tribeRole);
    }

    /// @notice Remove a TribeRole from having admin access to a pod
    /// @dev Permissioned to the GOVERNOR, ROLE_ADMIN (TribalCouncil) and GUARDIAN roles
    function revokePodAdminRole(uint256 _podId, bytes32 _tribeRole)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GUARDIAN
        )
    {
        podAdminRoles[_podId].remove(_tribeRole);
        emit RevokePodAdminRole(_podId, _tribeRole);
    }

    ///// Expose admin functionality to addresses which have the appropriate TribeRole

    /// @notice Admin functionality to add a member to a pod
    function addMemberToPod(uint256 _podId, address _member)
        external
        onlyPodAdmin(_podId)
    {
        require(_member != address(0), "ZERO_ADDRESS");
        memberToken.mint(_member, _podId, bytes(""));
    }

    /// @notice Admin functionality to remove a member from a pod
    function removeMemberFromPod(uint256 _podId, address _member)
        external
        onlyPodAdmin(_podId)
    {
        require(_member != address(0), "ZERO_ADDRESS");
        memberToken.burn(_member, _podId);
    }
}
