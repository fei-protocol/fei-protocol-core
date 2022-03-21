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
        // TODO
    }

    /////////////////////////    GRANT POD ADMIN PRIVILEDGES       ////////////////////////////

    /// @notice Admin functionality to add a member to a pod
    /// @dev Permissioned to GOVERNOR, POD_ADMIN, GUARDIAN and POD_ADMIN_ADD_MEMBER
    function addPodMember(uint256 _podId, address _member)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            TribeRoles.POD_ADMIN_ADD_MEMBER
        )
    {
        _addMemberToPod(_podId, _member);
    }

    /// @notice Internal method to add a member to a pod
    function _addMemberToPod(uint256 _podId, address _member) internal {
        require(_member != address(0), "ZERO_ADDRESS");
        emit AddPodMember(_podId, _member);
        memberToken.mint(_member, _podId, bytes(""));
    }

    /// @notice Admin functionality to batch add a member to a pod
    function batchAddMemberToPod(uint256 _podId, address[] memory _members)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            TribeRoles.POD_ADMIN_ADD_MEMBER
        )
    {
        uint256 numMembers = _members.length;
        for (uint256 i = 0; i < numMembers; ) {
            _addMemberToPod(_podId, _members[i]);

            // i is constrained by being < _members.length
            unchecked {
                i += 1;
            }
        }
    }

    /// @notice Admin functionality to remove a member from a pod.
    /// @dev Permissioned to GOVERNOR, POD_ADMIN, GUARDIAN and POD_ADMIN_REMOVE_MEMBER
    function removePodMember(uint256 _podId, address _member)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            TribeRoles.GUARDIAN,
            TribeRoles.POD_ADMIN_REMOVE_MEMBER
        )
    {
        _removePodMember(_podId, _member);
    }

    /// @notice Internal method to remove a member from a pod
    function _removePodMember(uint256 _podId, address _member) internal {
        require(_member != address(0), "ZERO_ADDRESS");
        emit RemovePodMember(_podId, _member);
        memberToken.burn(_member, _podId);
    }

    /// @notice Admin functionality to batch remove a member from a pod
    function batchRemoveMemberFromPod(uint256 _podId, address[] memory _members)
        external
    {
        uint256 numMembers = _members.length;
        for (uint256 i = 0; i < numMembers; ) {
            _removePodMember(_podId, _members[i]);

            // i is constrained by being < _members.length
            unchecked {
                i += 1;
            }
        }
    }
}
