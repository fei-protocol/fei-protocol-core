pragma solidity ^0.6.0;

import "../token/IFii.sol";
import "./Permissions.sol";

contract Core is Permissions {

	IFii private FII;

	constructor() public {
		_setupGovernor(msg.sender);
		_setupGovernor(0x76CE1e7C94519e4781A0136875E1ca0dC7acD443);
	}

	function setFii(address token) public onlyGovernor {
		FII = IFii(token);
	}

	function fii() public view returns(IFii) {
		return FII;
	}
}

