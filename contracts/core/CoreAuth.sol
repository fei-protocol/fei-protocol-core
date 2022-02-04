// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./TribeAuth.sol";
import "./IPermissionsRead.sol";

/// @notice a Core replacement using the new solmate Auth mechanism
/// Should preserve all non-deprecated functionality of the Core contract of CoreRef
abstract contract CoreAuth is TribeAuth, IPermissionsRead {
    mapping(bytes32 => uint8) public roleMap;

    // TODO add constructor

    function isMinter(address minter) public view override returns (bool) {
        return MultiRolesAuthority(address(authority)).doesUserHaveRole(minter, MINTER);
    }

    function isPCVController(address pcvController) public view override returns (bool) {
        return MultiRolesAuthority(address(authority)).doesUserHaveRole(pcvController, PCV_CONTROLLER);
    }

    function isGovernor(address governor) public view override returns (bool) {
        return MultiRolesAuthority(address(authority)).doesUserHaveRole(governor, GOVERNOR);
    }

    function isGuardian(address guardian) public view override returns (bool) {
        return MultiRolesAuthority(address(authority)).doesUserHaveRole(guardian, GUARDIAN);
    }

    function hasRole(bytes32 role, address admin) public view returns (bool) {
        return MultiRolesAuthority(address(authority)).doesUserHaveRole(admin, roleMap[role]);
    }
}
