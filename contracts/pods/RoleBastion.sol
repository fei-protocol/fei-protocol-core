// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Core} from "../core/Core.sol";
import {ICore} from "../core/ICore.sol";

/// @title RoleBastion
/// @notice Helper contract for allowing TribalCouncil to manage lower ranking roles
contract RoleBastion is CoreRef {
    constructor(address _core) CoreRef(_core) {}

    // How do I instigate the hierarchy?
    // Pre setup roles?
    //
    // Flow:
    // 1. Tribal council wants to grant a new role to a pod
    // 2. TribalCouncil calls into this contract
    // 3. Effectively only TribalCouncil can call this contract. Permissioned to ROLE_ADMIN
    // 4. How to make sure it can only create lower ranking roles?
    // 5.

    // There are existing roles that are already setup. Should maybe be a mapping of existing roles that
    // the TribalCouncil can allocate
    // There are new roles to create
    // Is there any way of doing this without granting GOVERNOR to this contract?

    function hasRole(bytes32 role, address account)
        external
        view
        returns (bool)
    {
        return core().hasRole(role, account);
    }

    /// @notice Create a role for, whose admin if the ROLE_ADMIN
    function createRole(bytes32 role)
        external
        onlyTribeRole(TribeRoles.ROLE_ADMIN)
    {
        // onlyGovernor can call create role
        core().createRole(role, TribeRoles.ROLE_ADMIN);

        // how does the tribal council create and grant roles when createRole() is locked down?
    }

    /// @notice Grant a role to an address
    function grantRole(bytes32 role, address to)
        external
        onlyTribeRole(TribeRoles.ROLE_ADMIN)
    {
        // only role admin can grant the role
        core().grantRole(role, to);
    }

    /// @notice Revoke a role from an address
    function revokeRole(bytes32 role, address from)
        external
        onlyTribeRole(TribeRoles.ROLE_ADMIN)
    {
        // only role admin can revoke
        core().revokeRole(role, from);
    }
}
