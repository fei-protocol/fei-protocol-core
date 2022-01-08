// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../external/solmate/src/auth/Auth.sol";
import "@openzeppelin/contracts/security/Pausable.sol";

abstract contract FeiAuth is Auth, Pausable {
    bytes32 public constant PCV_CONTROLLER_ROLE = keccak256("PCV_CONTROLLER_ROLE");
    bytes32 public constant GOVERN_ROLE = keccak256("GOVERN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    
    /// @notice a role used with a subset of governor permissions for this contract only
    bytes32 public CONTRACT_ADMIN_ROLE;

    event ContractAdminRoleUpdate(bytes32 indexed oldContractAdminRole, bytes32 indexed newContractAdminRole);

    modifier onlyPCVController() {
        require(isAuthorized(msg.sender, bytes4(PCV_CONTROLLER_ROLE)), "UNAUTHORIZED: PCV Controller");

        _;
    }

    modifier onlyGovernorOrAdmin() {
        require(isAuthorized(msg.sender, bytes4(GOVERN_ROLE)) || isAuthorized(msg.sender, bytes4(CONTRACT_ADMIN_ROLE)), "UNAUTHORIZED: Governor or Admin");

        _;
    }

    modifier onlyGovernor() {
        require(isAuthorized(msg.sender, bytes4(GOVERN_ROLE)), "UNAUTHORIZED: Governor");

        _;
    }

    modifier onlyGovernorOrGuardian() {
        require(isAuthorized(msg.sender, bytes4(GOVERN_ROLE)) || isAuthorized(msg.sender, bytes4(GUARDIAN_ROLE)), "UNAUTHORIZED: Governor or Guardian");

        _;
    }

    modifier onlyGovernorOrGuardianOrAdmin() {
        require(
            isAuthorized(msg.sender, bytes4(GOVERN_ROLE)) || 
            isAuthorized(msg.sender, bytes4(GUARDIAN_ROLE)) || 
            isAuthorized(msg.sender, bytes4(CONTRACT_ADMIN_ROLE)), 
            "UNAUTHORIZED"
        );

        _;
    }

    /// @notice sets a new admin role for this contract
    function setContractAdminRole(bytes32 newContractAdminRole) external onlyGovernor {
        _setContractAdminRole(newContractAdminRole);
    }

    /// @notice set pausable methods to paused
    function pause() public onlyGovernorOrGuardianOrAdmin {
        _pause();
    }

    /// @notice set pausable methods to unpaused
    function unpause() public onlyGovernorOrGuardianOrAdmin {
        _unpause();
    }

    function _setContractAdminRole(bytes32 newContractAdminRole) internal {
        bytes32 oldContractAdminRole = CONTRACT_ADMIN_ROLE;
        CONTRACT_ADMIN_ROLE = newContractAdminRole;
        emit ContractAdminRoleUpdate(oldContractAdminRole, newContractAdminRole);
    }
}