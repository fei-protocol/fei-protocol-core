// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {EnumerableSet} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Core} from "../core/Core.sol";

/// @title RolebastionCreator
/// @notice Used by ROLE_ADMIN to create new roles. Granted GOVERNOR role with a brutally simple API
///         Intended to be used by the TribalCouncil to manage creating roles necessary for pod operation
contract RoleBastionCreator is CoreRef {
    using EnumerableSet for EnumerableSet.Bytes32Set;

    event CreateNonMajorRole(bytes32 indexed role, bytes32 roleAdmin);

    /// @notice All roles granted by RoleBastionCreator
    EnumerableSet.Bytes32Set private allRoles;

    constructor(address _core) CoreRef(_core) {}

    ////////////      GETTERS       ///////////////

    /// @notice Get all the non-major roles that have been created by this contract
    /// TODO: Possible gas concerns? If this contract creates a large number of non-major roles
    /// then the storage may grow too large for this function to return
    /// Unlikely to be a problem
    function getCreatedNonMajorRoles()
        external
        view
        returns (bytes32[] memory)
    {
        return allRoles.values();
    }

    /// @notice Determine if a role has been created by this contract
    function isRole(bytes32 _role) external view returns (bool) {
        return allRoles.contains(_role);
    }

    ///////////////    STATE-CHANGING API         /////////////////

    /// @notice Create a role whose admin is the ROLE_ADMIN
    /// @param role Role to be created
    /// @dev Function is intended to be used by an address with ROLE_ADMIN, the TribalCouncil, to create
    ///      non-major roles. As this contract is granted the GOVERNOR role it would allow it to create major
    ///      roles. To prevent this, a specific check is made to ensure that existing major roles are not created
    ///      If they were to be called by `createRole()` on this contract, it would have the effect of transferring the
    ///      the specific major role's admin to the ROLE_ADMIN.
    ///
    ///      TODO:
    ///      In addition, a check is made that the role to be created does not already have an admin. If this holds,
    ///      then it means that the role being created is new and not held by the GOVERNOR for example.
    function createRole(bytes32 role)
        external
        onlyTribeRole(TribeRoles.ROLE_ADMIN)
    {
        // Requirements:
        // 2. Can only create roles that don't already have an admin
        require(
            role != TribeRoles.GOVERNOR &&
                role != TribeRoles.GUARDIAN &&
                role != TribeRoles.PCV_CONTROLLER &&
                role != TribeRoles.MINTER,
            "Only non-major roles can be created"
        );

        emit CreateNonMajorRole(role, TribeRoles.ROLE_ADMIN);
        core().createRole(role, TribeRoles.ROLE_ADMIN);

        // Would this brick if many roles were added?
        allRoles.add(role);
    }
}
