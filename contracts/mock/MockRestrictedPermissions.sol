// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../core/RestrictedPermissions.sol";

contract MockRestrictedPermissions is RestrictedPermissions {
    address public fei;
    address public tribe;
    bytes32 public constant GOVERN_ROLE = keccak256("GOVERN_ROLE");

    constructor(
        IPermissionsRead core,
        address _fei,
        address _tribe
    ) RestrictedPermissions(core) {
        fei = _fei;
        tribe = _tribe;
    }
}
