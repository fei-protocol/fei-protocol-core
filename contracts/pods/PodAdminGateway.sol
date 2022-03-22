// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {IMemberToken} from "./orcaInterfaces/IMemberToken.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";
import {IControllerV1} from "./orcaInterfaces/IControllerV1.sol";
import {Core} from "../core/Core.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {IPodAdminGateway} from "./IPodAdminGateway.sol";
import {IPodFactory} from "./IPodFactory.sol";

/// @title PodAdminGateway for TRIBE Governance pods
/// @notice Acts as a gateway for admin functionality and vetos in the TRIBE governance pod system
/// @dev Contract is intended to be set as the podAdmin for all deployed Orca pods. It then allows
///
contract PodAdminGateway is CoreRef, IPodAdminGateway {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    /// @notice Orca membership token for the pods. Handles permissioning pod members
    IMemberToken private immutable memberToken;

    /// @notice Pod factory which creates optimistic pods and acts as a source of information
    IPodFactory private immutable podFactory;

    constructor(
        address _core,
        address _memberToken,
        address _podFactory
    ) CoreRef(_core) {
        require(_memberToken != address(0x0), "ZERO_ADDRESS");
        require(_podFactory != address(0x0), "ZERO_ADDRESS");

        memberToken = IMemberToken(_memberToken);
        podFactory = IPodFactory(_podFactory);
    }

    ////////////////////////   GETTERS   ////////////////////////////////

    /// @notice Calculate the specific pod admin role related to adding pod members
    function getPodAddMemberRole(uint256 _podId) public pure returns (bytes32) {
        return keccak256(abi.encode(_podId, "ORCA_POD", "POD_ADD_MEMBER_ROLE"));
    }

    /// @notice Calculate the pod admin role related to removing pod members
    function getPodRemoveMemberRole(uint256 _podId)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(abi.encode(_podId, "ORCA_POD", "POD_REMOVE_MEMBER_ROLE"));
    }

    /// @notice Calculate the specific pod veto role, which allows an
    function getPodVetoRole(uint256 _podId) public pure returns (bytes32) {
        return keccak256(abi.encode(_podId, "ORCA_POD", "POD_VETO_ROLE"));
    }

    /// @notice Calculate the specific pod transfer admin role
    function getPodTransferAdminRole(uint256 _podId)
        public
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(_podId, "ORCA_POD", "POD_TRANSFER_ADMIN_ROLE")
            );
    }

    /////////////////////////    ADMIN PRIVILEDGES       ////////////////////////////

    /// @notice Transfer the pod admin address for a pod to another address
    function transferPodAdmin(uint256 _podId, address newPodAdmin)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            getPodTransferAdminRole(_podId)
        )
    {
        require(newPodAdmin != address(0x0), "ZERO_ADDRESS");
        _transferPodAdmin(_podId, newPodAdmin);
    }

    /// @notice Batch transfer the pod admin address for several pods
    /// @dev Mass transfer of podAdmins only expected to be performed by GOVERNOR or POD_ADMIN
    function batchTransferPodAdmins(
        uint256[] memory _podIds,
        address[] memory newPodAdmins
    ) external hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN) {
        require(
            _podIds.length == newPodAdmins.length,
            "MISMATCHED_ARG_LENGTHS"
        );
        uint256 numPodsToTransfer = _podIds.length;
        for (uint256 i = 0; i < numPodsToTransfer; ) {
            _transferPodAdmin(_podIds[i], newPodAdmins[i]);

            // i is bounded by numPodsToTransfer
            unchecked {
                i += 1;
            }
        }
    }

    /// @notice Transfer a pod admin from this gateway to another address
    function _transferPodAdmin(uint256 _podId, address newPodAdmin) internal {
        IControllerV1 podController = podFactory.podController();

        address oldPodAdmin = address(this);
        emit UpdatePodAdmin(_podId, oldPodAdmin, newPodAdmin);
        podController.updatePodAdmin(_podId, newPodAdmin);
    }

    /// @notice Admin functionality to add a member to a pod
    /// @dev Permissioned to GOVERNOR, POD_ADMIN and POD_ADD_MEMBER_ROLE
    function addPodMember(uint256 _podId, address _member)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            getPodAddMemberRole(_podId)
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
    /// @dev Permissioned to GOVERNOR, POD_ADMIN and POD_ADMIN_REMOVE_MEMBER
    function batchAddPodMember(uint256 _podId, address[] memory _members)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            getPodAddMemberRole(_podId)
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
        hasAnyOfFourRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            TribeRoles.GUARDIAN,
            getPodRemoveMemberRole(_podId)
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
    /// @dev Permissioned to GOVERNOR, POD_ADMIN, GUARDIAN and POD_ADMIN_REMOVE_MEMBER
    function batchRemovePodMember(uint256 _podId, address[] memory _members)
        external
        hasAnyOfFourRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_ADMIN,
            TribeRoles.GUARDIAN,
            getPodRemoveMemberRole(_podId)
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

    ///////////////  VETO CONTROLLER /////////////////

    /// @notice Allow a proposal to be vetoed in a pod timelock
    /// @dev Permissioned to GOVERNOR, POD_ADMIN, GUARDIAN and specific POD_VETO_ROLE
    function veto(uint256 _podId, bytes32 proposalId)
        external
        hasAnyOfFourRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.POD_VETO_ADMIN,
            TribeRoles.GUARDIAN,
            getPodVetoRole(_podId)
        )
    {
        address timelock = podFactory.getPodTimelock(_podId);
        emit VetoTimelock(_podId, timelock);
        TimelockController(payable(timelock)).cancel(proposalId);
    }
}