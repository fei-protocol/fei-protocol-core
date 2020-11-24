pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Permissions.sol";
import "../token/IFii.sol";

contract Core is Permissions {

	IFii private FII;

	constructor() public {
		_setupGovernor(msg.sender);
	}

	function setFii(address token) public onlyGovernor {
		FII = IFii(token);
	}

	function fii() public view returns(IFii) {
		return FII;
	}
}

