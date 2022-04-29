// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Core} from "../core/Core.sol";

/// @title RoleBastion
/// @notice Used by ROLE_ADMIN to create new roles. Granted GOVERNOR role with a simple API
contract RoleBastion is CoreRef {
    event BastionRoleCreate(bytes32 indexed role, bytes32 roleAdmin);

    constructor(address _core) CoreRef(_core) {}

    /// @notice Create a role whose admin is the ROLE_ADMIN
    /// @param role Role to be created
    /// @dev Function is used by an address with ROLE_ADMIN, e.g. the TribalCouncil, to create
    ///      non-major roles. A check is made to ensure that the role to be created does not
    ///      have an admin i.e. that it is a new admin.
    ///      Specificially, can not create the bytes32(0) role as this is set as the CONTRACT_ADMIN_ROLE
    ///      in core and has not been created yet.
    function createRole(bytes32 role) external onlyTribeRole(TribeRoles.ROLE_ADMIN) whenNotPaused {
        require(role != bytes32(0), "Can not create zero role");

        bytes32 roleAdmin = core().getRoleAdmin(role);
        require(roleAdmin == bytes32(0), "Role already exists");
        emit BastionRoleCreate(role, TribeRoles.ROLE_ADMIN);
        core().createRole(role, TribeRoles.ROLE_ADMIN);
    }
}
