pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract Permissions is AccessControl {
	bytes32 private constant BURNER_ROLE = keccak256("BURNER_ROLE");
	bytes32 private constant MINTER_ROLE = keccak256("MINTER_ROLE");
	bytes32 private constant RECLAIM_ROLE = keccak256("RECLAIM_ROLE");
	bytes32 private constant GOVERN_ROLE = keccak256("GOVERN_ROLE");

	constructor() public {
		_setRoleAdmin(MINTER_ROLE, GOVERN_ROLE);
		_setRoleAdmin(BURNER_ROLE, GOVERN_ROLE);
		_setRoleAdmin(RECLAIM_ROLE, GOVERN_ROLE);
		_setRoleAdmin(GOVERN_ROLE, GOVERN_ROLE);
	}

	modifier onlyGovernor() {
		require(isGovernor(msg.sender), "Caller is not a governor");
		_;
	}

	function isMinter(address _address) public view returns (bool) {
		return hasRole(MINTER_ROLE, _address);
	}

	function isBurner(address _address) public view returns (bool) {
		return hasRole(BURNER_ROLE, _address);
	}

	function isGovernor(address _address) public view returns (bool) {
		return hasRole(GOVERN_ROLE, _address);
	}

	function isReclaimer(address _address) public view returns (bool) {
		return hasRole(RECLAIM_ROLE, _address);
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

	function _setupGovernor(address governor) internal {
		_setupRole(GOVERN_ROLE, governor);
	}
}