pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Permissions.sol";
import "../token/IFii.sol";
import "../token/Fii.sol";

contract Core is Permissions {

	IFii private FII;

	constructor() public {
		_setupGovernor(msg.sender);
		Fii fii = new Fii(address(this));
		FII = IFii(address(fii));
	}

	function setFii(address token) public onlyGovernor {
		FII = IFii(token);
	}

	function fii() public view returns(IFii) {
		return FII;
	}
}

