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
    /// @dev Function is intended to be used by an address with ROLE_ADMIN, the TribalCouncil, to create
    ///      non-major roles. As this contract is granted the GOVERNOR role it would allow it to create major
    ///      roles. To prevent this, a check is made to ensure that the role does not have an admin (i.e. it's a
    ///      new admin)
    function createRole(bytes32 role)
        external
        onlyTribeRole(TribeRoles.ROLE_ADMIN)
    {
        bytes32 roleAdmin = core().getRoleAdmin(role);
        require(roleAdmin == bytes32(0), "Role already exists");
        emit BastionRoleCreate(role, TribeRoles.ROLE_ADMIN);
        core().createRole(role, TribeRoles.ROLE_ADMIN);
    }
}
