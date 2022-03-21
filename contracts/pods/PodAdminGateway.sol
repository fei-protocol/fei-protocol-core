// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IMemberToken} from "./orcaInterfaces/IMemberToken.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {IPodAdminGateway} from "./IPodAdminGateway.sol";

/// @title Multiple Pod Admins for Orca pods
/// @notice Expose pod admin functionality from Orca pods to multiple Tribe Roles.
/// @dev This contract is intended to be granted the podAdmin role on a deployed pod. This
///      contract then maintains it's own internal state of additional TribeRoles that it will
///      expose podAdmin actions to.
///      In this way, multiple podAdmins can be added per pod.
contract PodAdminGateway is CoreRef, IPodAdminGateway {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /// @notice Orca membership token for the pods. Handles permissioning pod members
    IMemberToken private immutable memberToken;

    /// @notice Mapping from a podId to an admin priviledge and the set of TribeRoles that have
    ///         been granted that admin priviledge on that pod
    /// @dev Used to permission the exposure of pod admin priviledges to multiple TribeRoles
    mapping(uint256 => mapping(AdminPriviledge => EnumerableSet.Bytes32Set))
        private podAdminRoles;

    constructor(address _core, address _memberToken) CoreRef(_core) {
        memberToken = IMemberToken(_memberToken);
    }

    /////////////////////////     GETTERS                   ///////////////////////

    /// @notice Get all TribeRoles which have a particular admin priviledge on a pod
    function getPodAdminPriviledges(uint256 _podId, AdminPriviledge _priviledge)
        external
        view
        returns (bytes32[] memory)
    {
        if (podAdminRoles[_podId][_priviledge].length() == 0) {
            bytes32[] memory emptyAdmins = new bytes32[](0);
            return emptyAdmins;
        }
        return podAdminRoles[_podId][_priviledge].values();
    }

    /////////////////////////     STATE CHANGING API       ////////////////////////////

    ///// Grant and revoke pod admin functionality to Tribe Roles

    /// @notice Grant an admin priviledge to a TribeRole
    /// @dev Permissioned to the GOVERNOR, ROLE_ADMIN (TribalCouncil)
    function grantPodAdminPriviledge(
        uint256 _podId,
        AdminPriviledge priviledge,
        bytes32 _tribeRole
    ) public hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.ROLE_ADMIN) {
        podAdminRoles[_podId][priviledge].add(_tribeRole);
        emit GrantPodAdminPriviledge(_podId, _tribeRole);
    }

    /// @notice Revoke an admin priviledge from a TribeRole
    /// @dev Permissioned to the GOVERNOR, ROLE_ADMIN (TribalCouncil) and GUARDIAN roles
    function revokePodAdminPriviledge(
        uint256 _podId,
        AdminPriviledge priviledge,
        bytes32 _tribeRole
    )
        public
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GUARDIAN
        )
    {
        podAdminRoles[_podId][priviledge].remove(_tribeRole);
        emit RevokePodAdminPriviledge(_podId, _tribeRole);
    }

    /// @notice Batch grant admin priviledges
    function batchGrantAdminPriviledge(
        uint256[] memory _podId,
        AdminPriviledge[] memory priviledge,
        bytes32[] memory _tribeRole
    ) external hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.ROLE_ADMIN) {
        for (uint256 i = 0; i < _podId.length; i++) {
            grantPodAdminPriviledge(_podId[i], priviledge[i], _tribeRole[i]);
        }
    }

    /// @notice Batch grant admin priviledges
    function batchRevokeAdminPriviledge(
        uint256[] memory _podId,
        AdminPriviledge[] memory priviledge,
        bytes32[] memory _tribeRole
    )
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GUARDIAN
        )
    {
        for (uint256 i = 0; i < _podId.length; i++) {
            revokePodAdminPriviledge(_podId[i], priviledge[i], _tribeRole[i]);
        }
    }

    ///// Expose admin functionality to addresses which have the appropriate TribeRole

    /// @notice Admin functionality to add a member to a pod
    function addMemberToPod(uint256 _podId, address _member) public {
        require(_member != address(0), "ZERO_ADDRESS");
        validateAdminPriviledge(_podId, AdminPriviledge.ADD_MEMBER, msg.sender);

        memberToken.mint(_member, _podId, bytes(""));
    }

    /// @notice Admin functionality to batch add a member to a pod
    function batchAddMemberToPod(uint256 _podId, address[] memory _members)
        external
    {
        for (uint256 i = 0; i < _members.length; i++) {
            addMemberToPod(_podId, _members[i]);
        }
    }

    /// @notice Admin functionality to remove a member from a pod
    function removeMemberFromPod(uint256 _podId, address _member) public {
        require(_member != address(0), "ZERO_ADDRESS");

        validateAdminPriviledge(
            _podId,
            AdminPriviledge.REMOVE_MEMBER,
            msg.sender
        );
        memberToken.burn(_member, _podId);
    }

    /// @notice Admin functionality to batch remove a member from a pod
    function batchRemoveMemberFromPod(uint256 _podId, address[] memory _members)
        external
    {
        for (uint256 i = 0; i < _members.length; i++) {
            removeMemberFromPod(_podId, _members[i]);
        }
    }

    /// @notice Valdidate that a calling address has the relevant admin priviledge, for the
    ///         function it is calling
    function validateAdminPriviledge(
        uint256 _podId,
        AdminPriviledge priviledge,
        address caller
    ) internal view {
        ICore core = core();
        bool hasAdminRole = false;

        // Iterate through all TribeRoles that have correct priviledge, validate caller has one of these roles
        uint256 numTribeRolesWithPriviledge = podAdminRoles[_podId][priviledge]
            .length();
        for (uint256 i = 0; i < numTribeRolesWithPriviledge; ) {
            bytes32 role = podAdminRoles[_podId][priviledge].at(i);

            if (core.hasRole(role, caller)) {
                hasAdminRole = true;
            }

            // unchecked as i is bounded by podAdminRoles[_podId][priviledge].length()
            unchecked {
                i += 1;
            }
        }

        if (!hasAdminRole) {
            revert UnauthorisedAdminAction();
        }
    }
}
