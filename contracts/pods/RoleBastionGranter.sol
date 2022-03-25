// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Core} from "../core/Core.sol";
import {ICore} from "../core/ICore.sol";

/// @title RoleBastionGranter
/// @notice Bastion for creating roles under the control of the ROLE_ADMIN
/// @dev Intended to be used by the TribalCouncil to manage authorising and revoking lower ranking pods
///      access over system components
contract RoleBastionGranter is CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;
    using EnumerableSet for EnumerableSet.Bytes32Set;

    constructor(address _core) CoreRef(_core) {}

    event BastionRoleGrant(bytes32 indexed role, address to);
    event BastionRoleRevoke(bytes32 indexed role, address from);

    /// @notice All roles granted by RoleBastion
    EnumerableSet.Bytes32Set private allRoles;

    /// @notice On-chain location to track granted non-major roles
    mapping(bytes32 => EnumerableSet.AddressSet) private nonMajorRoles;

    /////////////////    GETTERS    /////////////////////////

    /// @notice Return all addresses that have been granted a particular role by the RoleBastion
    function getAddressesWithRole(bytes32 role)
        external
        view
        returns (address[] memory)
    {
        return nonMajorRoles[role].values();
    }

    /// @notice Get all the roles that have been granted by the RoleBastion
    function getAllRolesGranted() external view returns (bytes32[] memory) {
        return allRoles.values();
    }

    /// @notice Convenience getter to check if an account has a role
    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool)
    {
        return core().hasRole(role, account);
    }

    ////////////////     STATE-CHANGING API    /////////////////////////

    /// @notice Grant a role to an address. Only the ROLE_ADMIN can call this
    function grantRole(bytes32 role, address to)
        external
        onlyTribeRole(TribeRoles.ROLE_ADMIN)
    {
        // Add explicit guard that major roles cannot be granted.
        // It is a redundant check as Core access control will also protect
        //  - ROLE_ADMIN is not the admin of major roles
        require(
            role != TribeRoles.GOVERNOR &&
                role != TribeRoles.GUARDIAN &&
                role != TribeRoles.PCV_CONTROLLER &&
                role != TribeRoles.MINTER,
            "Only non-major roles can be granted"
        );

        nonMajorRoles[role].add(to);
        allRoles.add(role);

        emit BastionRoleGrant(role, to);
        core().grantRole(role, to);
    }

    /// @notice Revoke a role from an address
    function revokeRole(bytes32 role, address from)
        external
        onlyTribeRole(TribeRoles.ROLE_ADMIN)
    {
        require(
            role != TribeRoles.GOVERNOR &&
                role != TribeRoles.GUARDIAN &&
                role != TribeRoles.PCV_CONTROLLER &&
                role != TribeRoles.MINTER,
            "Only non-major roles can be revoked"
        );

        nonMajorRoles[role].remove(from);
        allRoles.remove(role);
        emit BastionRoleRevoke(role, from);
        core().revokeRole(role, from);
    }
}
