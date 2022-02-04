// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity ^0.8.0;

import "../external/solmate/src/auth/authorities/MultiRolesAuthority.sol";

/// @notice Admin based Authority for a MultiRolesAuthority
abstract contract TribeAuthority is MultiRolesAuthority {

    mapping(uint8 => bytes32) public getRoleAdmins;

    // TODO add a way to assign admins and a constructor
    
    /*///////////////////////////////////////////////////////////////
                      USER ROLE ASSIGNMENT LOGIC
    //////////////////////////////////////////////////////////////*/

    function isRoleAdmin(address admin, uint8 role) public view returns(bool) {
        return (getRoleAdmins[role] & getUserRoles[admin]) != bytes32(0);
    }

    function setUserRole(
        address user,
        uint8 role,
        bool enabled
    ) public override {
        require(isRoleAdmin(msg.sender, role));

        if (enabled) {
            getUserRoles[user] |= bytes32(1 << role);
        } else {
            getUserRoles[user] &= ~bytes32(1 << role);
        }

        emit UserRoleUpdated(user, role, enabled);
    }
}
