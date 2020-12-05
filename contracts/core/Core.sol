pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Permissions.sol";
import "../token/IFei.sol";
import "../token/Fei.sol";

contract Core is Permissions {

	IFei public fei;
	uint public genesisPeriodEnd;
	address public genesisGroup;

	constructor() public {
		_setupGovernor(msg.sender);
		Fei _fei = new Fei(address(this));
		fei = IFei(address(_fei));
	}

	function setFei(address token) public onlyGovernor {
		fei = IFei(token);
	}

	function setGenesisGroup(address _genesisGroup) public onlyGovernor {
		genesisGroup = _genesisGroup;
	}

	function setGenesisPeriodEnd(uint _genesisPeriodEnd) public onlyGovernor {
		genesisPeriodEnd = _genesisPeriodEnd;
	}

	function isGenesisPeriod() public view returns(bool) {
		return now < genesisPeriodEnd;
	}
}

