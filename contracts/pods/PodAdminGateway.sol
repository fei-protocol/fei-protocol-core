// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";
import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";
import {Core} from "../core/Core.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {IPodAdminGateway} from "./interfaces/IPodAdminGateway.sol";
import {IPodFactory} from "./interfaces/IPodFactory.sol";

/// @title PodAdminGateway for TRIBE Governance pods
/// @notice Acts as a gateway for admin functionality and vetos in the TRIBE governance pod system
/// @dev Contract is intended to be set as the podAdmin for all deployed Orca pods. Specifically enables:
///     1. Adding a member to a pod
///     2. Removing a member from a pod
///     3. Transferring a pod member
///     4. Toggling a pod membership transfer switch
///     5. Vetoing a pod proposal
contract PodAdminGateway is CoreRef, IPodAdminGateway {
    /// @notice Orca membership token for the pods. Handles permissioning pod members
    MemberToken private immutable memberToken;

    /// @notice Pod factory which creates optimistic pods and acts as a source of information
    IPodFactory public immutable podFactory;

    constructor(
        address _core,
        address _memberToken,
        address _podFactory
    ) CoreRef(_core) {
        memberToken = MemberToken(_memberToken);
        podFactory = IPodFactory(_podFactory);
    }

    ////////////////////////   GETTERS   ////////////////////////////////
    /// @notice Calculate the specific pod admin role identifier
    /// @dev This role is able to add pod members, remove pod members, lock and unlock transfers and veto
    ///      proposals
    function getSpecificPodAdminRole(uint256 _podId) public pure override returns (bytes32) {
        return keccak256(abi.encode(_podId, "_ORCA_POD", "_ADMIN"));
    }

    /// @notice Calculate the specific pod guardian role identifier
    /// @dev This role is able to remove pod members and veto pod proposals
    function getSpecificPodGuardianRole(uint256 _podId) public pure override returns (bytes32) {
        return keccak256(abi.encode(_podId, "_ORCA_POD", "_GUARDIAN"));
    }

    /////////////////////////    ADMIN PRIVILEDGES       ////////////////////////////

    /// @notice Admin functionality to add a member to a pod
    /// @dev Permissioned to GOVERNOR, POD_ADMIN and POD_ADD_MEMBER_ROLE
    function addPodMember(uint256 _podId, address _member)
        external
        override
        hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN, getSpecificPodAdminRole(_podId))
    {
        _addMemberToPod(_podId, _member);
    }

    /// @notice Internal method to add a member to a pod
    function _addMemberToPod(uint256 _podId, address _member) internal {
        emit AddPodMember(_podId, _member);
        memberToken.mint(_member, _podId, bytes(""));
    }

    /// @notice Admin functionality to batch add a member to a pod
    /// @dev Permissioned to GOVERNOR, POD_ADMIN and POD_ADMIN_REMOVE_MEMBER
    function batchAddPodMember(uint256 _podId, address[] calldata _members)
        external
        override
        hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN, getSpecificPodAdminRole(_podId))
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
        override
        hasAnyOfFiveRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            TribeRoles.GUARDIAN,
            getSpecificPodGuardianRole(_podId),
            getSpecificPodAdminRole(_podId)
        )
    {
        _removePodMember(_podId, _member);
    }

    /// @notice Internal method to remove a member from a pod
    function _removePodMember(uint256 _podId, address _member) internal {
        emit RemovePodMember(_podId, _member);
        memberToken.burn(_member, _podId);
    }

    /// @notice Admin functionality to batch remove a member from a pod
    /// @dev Permissioned to GOVERNOR, POD_ADMIN, GUARDIAN and POD_ADMIN_REMOVE_MEMBER
    function batchRemovePodMember(uint256 _podId, address[] calldata _members)
        external
        override
        hasAnyOfFiveRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            TribeRoles.GUARDIAN,
            getSpecificPodGuardianRole(_podId),
            getSpecificPodAdminRole(_podId)
        )
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

    /// @notice Admin functionality to turn off pod membership transfer
    /// @dev Permissioned to GOVERNOR, POD_ADMIN and the specific pod admin role
    function lockMembershipTransfers(uint256 _podId)
        external
        override
        hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN, getSpecificPodAdminRole(_podId))
    {
        _setMembershipTransferLock(_podId, true);
    }

    /// @notice Admin functionality to turn on pod membership transfers
    /// @dev Permissioned to GOVERNOR, POD_ADMIN and the specific pod admin role
    function unlockMembershipTransfers(uint256 _podId)
        external
        override
        hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN, getSpecificPodAdminRole(_podId))
    {
        _setMembershipTransferLock(_podId, false);
    }

    /// @notice Internal method to toggle a pod membership transfer lock
    function _setMembershipTransferLock(uint256 _podId, bool _lock) internal {
        ControllerV1 podController = ControllerV1(memberToken.memberController(_podId));
        podController.setPodTransferLock(_podId, _lock);
        emit PodMembershipTransferLock(_podId, _lock);
    }

    /// @notice Transfer the admin of a pod to a new address
    /// @dev Permissioned to GOVERNOR, POD_ADMIN and the specific pod admin role
    function transferAdmin(uint256 _podId, address _newAdmin)
        external
        hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN, getSpecificPodAdminRole(_podId))
    {
        ControllerV1 podController = ControllerV1(memberToken.memberController(_podId));
        address oldPodAdmin = podController.podAdmin(_podId);

        podController.updatePodAdmin(_podId, _newAdmin);
        emit UpdatePodAdmin(_podId, oldPodAdmin, _newAdmin);
    }

    ///////////////  VETO CONTROLLER /////////////////

    /// @notice Allow a proposal to be vetoed in a pod timelock
    /// @dev Permissioned to GOVERNOR, POD_VETO_ADMIN, GUARDIAN, POD_ADMIN and the specific
    ///      pod admin and guardian roles
    function veto(uint256 _podId, bytes32 _proposalId)
        external
        override
        hasAnyOfSixRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_VETO_ADMIN,
            TribeRoles.GUARDIAN,
            TribeRoles.POD_ADMIN,
            getSpecificPodGuardianRole(_podId),
            getSpecificPodAdminRole(_podId)
        )
    {
        address _podTimelock = podFactory.getPodTimelock(_podId);
        emit VetoTimelock(_podId, _podTimelock, _proposalId);
        TimelockController(payable(_podTimelock)).cancel(_proposalId);
    }
}
