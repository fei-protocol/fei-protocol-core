// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {IMemberToken} from "./orcaInterfaces/IMemberToken.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {TribeRoles} from "../core/TribeRoles.sol";

/// @title Multiple Pod Admins for Orca pods
/// @notice Expose pod admin functionality from Orca pods to multiple addresses
/// @dev This contract is intended to be granted the podAdmin role on a deployed pod. This
///      contract then maintains it's own internal state of additional addresses that it will
///      expose podAdmin actions to. In this way, multiple podAdmins can be added per pod via this
///      contract.
contract MultiPodAdmin is CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;

    /// @notice Orca membership token for the pods. Handles permissioning pod members
    IMemberToken private immutable memberToken;

    /// @notice Mapping between a podId and all added admins
    mapping(uint256 => EnumerableSet.AddressSet) private podAdmins;

    event AddPodAdmin(uint256 indexed podId, address indexed addAdmin);
    event RemovePodAdmin(uint256 indexed podId, address indexed removeAdmin);

    /// @notice Permission for an address to access admin functionality on a pod
    modifier onlyPodAdmin(uint256 podId) {
        require(
            podAdmins[podId].contains(msg.sender),
            "Caller not added as an admin"
        );
        _;
    }

    constructor(address _core, address _memberToken) CoreRef(_core) {
        memberToken = IMemberToken(_memberToken);
    }

    /////////////////////////     GETTERS                   ///////////////////////

    /// @notice Get all pod admins for a pod
    function getPodAdmins(uint256 _podId)
        external
        view
        returns (address[] memory)
    {
        if (podAdmins[_podId].length() == 0) {
            address[] memory emptyAdmins = new address[](0);
            return emptyAdmins;
        }
        return podAdmins[_podId].values();
    }

    /////////////////////////     STATE CHANGING API       ////////////////////////////

    /// @notice Add an admin to a pod, making admin functionality available to it
    /// @dev Permissioned to the GOVERNOR, ROLE_ADMIN (TribalCouncil) and GUARDIAN roles
    function addPodAdmin(uint256 _podId, address _adminToAdd)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GUARDIAN
        )
    {
        require(_adminToAdd != address(0), "ZERO_ADDRESS");
        require(
            !podAdmins[_podId].contains(_adminToAdd),
            "Admin already added"
        );
        emit AddPodAdmin(_podId, _adminToAdd);

        bool success = podAdmins[_podId].add(_adminToAdd);
        require(success, "Failed to add admin");
    }

    /// @notice Remove an admin to a pod, making admin functionality available to it
    /// @dev Permissioned to the GOVERNOR, ROLE_ADMIN (TribalCouncil) and GUARDIAN roles
    function removePodAdmin(uint256 _podId, address _adminToRemove)
        external
        hasAnyOfThreeRoles(
            TribeRoles.GOVERNOR,
            TribeRoles.ROLE_ADMIN,
            TribeRoles.GUARDIAN
        )
    {
        require(_adminToRemove != address(0), "ZERO_ADDRESS");
        require(
            podAdmins[_podId].contains(_adminToRemove),
            "Remove address is not admin"
        );
        emit RemovePodAdmin(_podId, _adminToRemove);

        bool success = podAdmins[_podId].remove(_adminToRemove);
        require(success, "Failed to remove admin");
    }

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
