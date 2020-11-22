pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Permissions.sol";
import "../token/IFii.sol";

contract Core is Permissions {

	IFii private FII;

	constructor(address governor, address fii) public {
		_setupGovernor(msg.sender);
		_setupGovernor(governor);
		FII = IFii(fii);
	}

	function setFii(address token) public onlyGovernor {
		FII = IFii(token);
	}

	function fii() public view returns(IFii) {
		return FII;
	}
}

