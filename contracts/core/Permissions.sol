pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Permissions is AccessControl {
	bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 public constant PCV_CONTROLLER_ROLE = keccak256("PCV_CONTROLLER_ROLE");
	bytes32 public constant GOVERN_ROLE = keccak256("GOVERN_ROLE");
	bytes32 public constant REVOKE_ROLE = keccak256("REVOKE_ROLE");

	constructor() public {
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

	// Retain the ability for governor to define future roles (or update admins)
	function createRole(bytes32 role, bytes32 adminRole) public onlyGovernor {
		_setRoleAdmin(role, adminRole);
	}

	function grantMinter(address minter) public onlyGovernor {
		grantRole(MINTER_ROLE, minter);
	} 

	function grantBurner(address burner) public onlyGovernor {
		grantRole(BURNER_ROLE, burner);
	} 

	function grantPCVController(address pcvController) public onlyGovernor {
		grantRole(PCV_CONTROLLER_ROLE, pcvController);
	}

	function grantGovernor(address governor) public onlyGovernor {
		grantRole(GOVERN_ROLE, governor);
	}

	function grantRevoker(address revoker) public onlyGovernor {
		grantRole(REVOKE_ROLE, revoker);
	}

	function revokeMinter(address minter) public onlyGovernor {
		revokeRole(MINTER_ROLE, minter);
	} 

	function revokeBurner(address burner) public onlyGovernor {
		revokeRole(BURNER_ROLE, burner);
	} 

	function revokePCVController(address pcvController) public onlyGovernor {
		revokeRole(PCV_CONTROLLER_ROLE, pcvController);
	}

	function revokeGovernor(address governor) public onlyGovernor {
		revokeRole(GOVERN_ROLE, governor);
	}

	function revokeRevoker(address revoker) public onlyGovernor {
		revokeRole(REVOKE_ROLE, revoker);
	}

	function revokeOverride(bytes32 role, address account) public onlyRevoker {
		this.revokeRole(role, account);
	}

	function isMinter(address _address) public view returns (bool) {
		return hasRole(MINTER_ROLE, _address);
	}

	function isBurner(address _address) public view returns (bool) {
		return hasRole(BURNER_ROLE, _address);
	}

	// only virtual for testing mock override
	function isGovernor(address _address) public view virtual returns (bool) {
		return hasRole(GOVERN_ROLE, _address);
	}

	function isRevoker(address _address) public view returns (bool) {
		return hasRole(REVOKE_ROLE, _address);
	}

	function isPCVController(address _address) public view returns (bool) {
		return hasRole(PCV_CONTROLLER_ROLE, _address);
	}

	function _setupGovernor(address governor) internal {
		_setupRole(GOVERN_ROLE, governor);
	}
}