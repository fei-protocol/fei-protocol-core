pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./IPermissions.sol";

/// @title IPermissions implementation
/// @author Fei Protocol
contract Permissions is IPermissions, AccessControl {
	bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 public constant PCV_CONTROLLER_ROLE = keccak256("PCV_CONTROLLER_ROLE");
	bytes32 public constant GOVERN_ROLE = keccak256("GOVERN_ROLE");
	bytes32 public constant REVOKE_ROLE = keccak256("REVOKE_ROLE");

	constructor() public {
		_setupGovernor(address(this));
		_setRoleAdmin(MINTER_ROLE, GOVERN_ROLE);
		_setRoleAdmin(BURNER_ROLE, GOVERN_ROLE);
		_setRoleAdmin(PCV_CONTROLLER_ROLE, GOVERN_ROLE);
		_setRoleAdmin(GOVERN_ROLE, GOVERN_ROLE);
		_setRoleAdmin(REVOKE_ROLE, GOVERN_ROLE);
	}

	modifier onlyGovernor() {
		require(isGovernor(msg.sender), "Permissions: Caller is not a governor");
		_;
	}

	modifier onlyRevoker() {
		require(isRevoker(msg.sender), "Permissions: Caller is not a revoker");
		_;
	}

	function createRole(bytes32 role, bytes32 adminRole) external override onlyGovernor {
		_setRoleAdmin(role, adminRole);
	}

	function grantMinter(address minter) external override onlyGovernor {
		grantRole(MINTER_ROLE, minter);
	} 

	function grantBurner(address burner) external override onlyGovernor {
		grantRole(BURNER_ROLE, burner);
	} 

	function grantPCVController(address pcvController) external override onlyGovernor {
		grantRole(PCV_CONTROLLER_ROLE, pcvController);
	}

	function grantGovernor(address governor) external override onlyGovernor {
		grantRole(GOVERN_ROLE, governor);
	}

	function grantRevoker(address revoker) external override onlyGovernor {
		grantRole(REVOKE_ROLE, revoker);
	}

	function revokeMinter(address minter) external override onlyGovernor {
		revokeRole(MINTER_ROLE, minter);
	} 

	function revokeBurner(address burner) external override onlyGovernor {
		revokeRole(BURNER_ROLE, burner);
	} 

	function revokePCVController(address pcvController) external override onlyGovernor {
		revokeRole(PCV_CONTROLLER_ROLE, pcvController);
	}

	function revokeGovernor(address governor) external override onlyGovernor {
		revokeRole(GOVERN_ROLE, governor);
	}

	function revokeRevoker(address revoker) external override onlyGovernor {
		revokeRole(REVOKE_ROLE, revoker);
	}

	function revokeOverride(bytes32 role, address account) external override onlyRevoker {
		this.revokeRole(role, account);
	}

	function isMinter(address _address) external override view returns (bool) {
		return hasRole(MINTER_ROLE, _address);
	}

	function isBurner(address _address) external override view returns (bool) {
		return hasRole(BURNER_ROLE, _address);
	}

	function isPCVController(address _address) external override view returns (bool) {
		return hasRole(PCV_CONTROLLER_ROLE, _address);
	}

	// only virtual for testing mock override
	function isGovernor(address _address) public override view virtual returns (bool) {
		return hasRole(GOVERN_ROLE, _address);
	}

	function isRevoker(address _address) public override view returns (bool) {
		return hasRole(REVOKE_ROLE, _address);
	}

	function _setupGovernor(address governor) internal {
		_setupRole(GOVERN_ROLE, governor);
	}
}