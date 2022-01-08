// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../external/solmate/src/auth/Auth.sol";
import "./IPermissions.sol";

contract FeiAuthority is Authority {

    IPermissions constant CORE = IPermissions(0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9);
    bytes32 public constant GOVERN_ROLE = keccak256("GOVERN_ROLE");

    event RoleUpdate(bytes4 indexed selector, bytes32 indexed oldRole, bytes32 indexed newRole);

    mapping(bytes4 => bytes32) public roleMap;

    constructor(bytes4[] memory selectors, bytes32[] memory roles) {
        require(selectors.length == roles.length, "length mismatch");
        for (uint256 i = 0; i < roles.length; i++) {
            _setRole(selectors[i], roles[i]);   
        }
    }
    
    function setRole(bytes4 selector, bytes32 role) external {
        require(CORE.hasRole(GOVERN_ROLE, msg.sender));
        _setRole(selector, role);
    }

    function _setRole(bytes4 selector, bytes32 newRole) internal {
        bytes32 oldRole = roleMap[selector];
        roleMap[selector] = newRole;
        emit RoleUpdate(selector, oldRole, newRole);
    }

    function canCall(
        address user,
        address, // target address not used
        bytes4 functionSig
    ) external view returns (bool) {
        bytes32 role = roleMap[functionSig];
        return role != bytes32(0) && CORE.hasRole(role, user);
    }
}
