pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Permissions is AccessControl {
	bytes32 public constant BURNER_ROLE = keccak256("BURNER_ROLE");
	bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 public constant RECLAIM_ROLE = keccak256("RECLAIM_ROLE");
	bytes32 public constant GOVERN_ROLE = keccak256("GOVERN_ROLE");

	constructor() public {
		_setRoleAdmin(MINTER_ROLE, GOVERN_ROLE);
		_setRoleAdmin(BURNER_ROLE, GOVERN_ROLE);
		_setRoleAdmin(RECLAIM_ROLE, GOVERN_ROLE);
		_setRoleAdmin(GOVERN_ROLE, GOVERN_ROLE);
	}

	modifier onlyGovernor() {
		require(isGovernor(msg.sender), "Permissions: Caller is not a governor");
		_;
	}

	function grantMinter(address minter) public onlyGovernor {
		grantRole(MINTER_ROLE, minter);
	} 

	function grantBurner(address burner) public onlyGovernor {
		grantRole(BURNER_ROLE, burner);
	} 

	function grantReclaimer(address reclaimer) public onlyGovernor {
		grantRole(RECLAIM_ROLE, reclaimer);
	}

	function grantGovernor(address governor) public onlyGovernor {
		grantRole(GOVERN_ROLE, governor);
	}

	function revokeMinter(address minter) public onlyGovernor {
		revokeRole(MINTER_ROLE, minter);
	} 

	function revokeBurner(address burner) public onlyGovernor {
		revokeRole(BURNER_ROLE, burner);
	} 

	function revokeReclaimer(address reclaimer) public onlyGovernor {
		revokeRole(RECLAIM_ROLE, reclaimer);
	}

	function revokeGovernor(address governor) public onlyGovernor {
		revokeRole(GOVERN_ROLE, governor);
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

	function isReclaimer(address _address) public view returns (bool) {
		return hasRole(RECLAIM_ROLE, _address);
	}

	function _setupGovernor(address governor) internal {
		_setupRole(GOVERN_ROLE, governor);
	}
}