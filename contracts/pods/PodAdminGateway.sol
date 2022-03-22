// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IMemberToken} from "./orcaInterfaces/IMemberToken.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";
import {Core} from "../core/Core.sol";
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

    ////////////////////////   GETTERS   ////////////////////////////////

    /// @notice Calculate the specific pod admin role related to adding pod members
    function getPodAddMemberRole(uint256 _podId) public pure returns (bytes32) {
        return keccak256(abi.encode(_podId, "ORCA_POD", "POD_ADD_MEMBER_ROLE"));
    }

    /// @notice Calculate the pod admin role related ot removing pod members
    function getPodRemoveMemberRole(uint256 _podId)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(abi.encode(_podId, "ORCA_POD", "POD_REMOVE_MEMBER_ROLE"));
    }

    /////////////////////////    ADMIN PRIVILEDGES       ////////////////////////////

    /// @notice Admin functionality to add a member to a pod
    /// @dev Permissioned to GOVERNOR, POD_ADMIN, GUARDIAN and POD_ADD_MEMBER_ROLE
    function addPodMember(uint256 _podId, address _member) external {
        validateAddPodMember(_podId);
        _addMemberToPod(_podId, _member);
    }

    /// @notice Validate the calling address is able to remove a pod member
    /// @dev Valid permissions are GOVERNOR, POD_ADMIN and POD_REMOVE_MEMBER_ROLE
    function validateAddPodMember(uint256 _podId) internal view {
        // ROLE_ID = Hash(podId, Orca salt, ROLE_NAME)
        bytes32 POD_ADMIN_ADD_MEMBER_ROLE = getPodAddMemberRole(_podId);
        ICore core = core();
        require(
            core.hasRole(TribeRoles.GOVERNOR, msg.sender) ||
                core.hasRole(TribeRoles.POD_ADMIN, msg.sender) ||
                core.hasRole(POD_ADMIN_ADD_MEMBER_ROLE, msg.sender),
            "UNAUTHORISED"
        );
    }

    /// @notice Internal method to add a member to a pod
    function _addMemberToPod(uint256 _podId, address _member) internal {
        require(_member != address(0), "ZERO_ADDRESS");
        emit AddPodMember(_podId, _member);
        memberToken.mint(_member, _podId, bytes(""));
    }

    /// @notice Admin functionality to batch add a member to a pod
    function batchAddPodMember(uint256 _podId, address[] memory _members)
        external
    {
        validateAddPodMember(_podId);
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
    function removePodMember(uint256 _podId, address _member) external {
        validateRemovePodMember(_podId);
        _removePodMember(_podId, _member);
    }

    /// @notice Validate the calling address is able to remove a pod member
    /// @dev Valid permissions are GOVERNOR, POD_ADMIN, GUARDIAN and POD_ADMIN_REMOVE_MEMBER
    function validateRemovePodMember(uint256 _podId) internal view {
        // ROLE_ID = Hash(podId, Orca salt, ROLE_NAME)
        bytes32 POD_ADMIN_REMOVE_MEMBER = getPodRemoveMemberRole(_podId);
        ICore core = core();
        require(
            core.hasRole(TribeRoles.GOVERNOR, msg.sender) ||
                core.hasRole(TribeRoles.POD_ADMIN, msg.sender) ||
                core.hasRole(TribeRoles.GUARDIAN, msg.sender) ||
                core.hasRole(POD_ADMIN_REMOVE_MEMBER, msg.sender),
            "UNAUTHORISED"
        );
    }

    /// @notice Internal method to remove a member from a pod
    function _removePodMember(uint256 _podId, address _member) internal {
        require(_member != address(0), "ZERO_ADDRESS");
        emit RemovePodMember(_podId, _member);
        memberToken.burn(_member, _podId);
    }

    /// @notice Admin functionality to batch remove a member from a pod
    function batchRemovePodMember(uint256 _podId, address[] memory _members)
        external
    {
        validateRemovePodMember(_podId);
        uint256 numMembers = _members.length;
        for (uint256 i = 0; i < numMembers; ) {
            _removePodMember(_podId, _members[i]);

            // i is constrained by being < _members.length
            unchecked {
                i += 1;
            }
        }
    }

    ///////////////  VETO CONTROLLER /////////////////
}
