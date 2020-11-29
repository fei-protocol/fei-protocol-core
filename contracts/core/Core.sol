pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Permissions.sol";
import "../token/IFei.sol";
import "../token/Fei.sol";

contract Core is Permissions {

	IFei private FEI;

	constructor() public {
		_setupGovernor(msg.sender);
		Fei fei = new Fei(address(this));
		FEI = IFei(address(fei));
	}

	function setFei(address token) public onlyGovernor {
		FEI = IFei(token);
	}

	function fei() public view returns(IFei) {
		return FEI;
	}
}

