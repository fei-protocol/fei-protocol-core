pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Permissions.sol";
import "../token/IFei.sol";
import "../token/Fei.sol";

contract Core is Permissions {

	IFei public fei;
	uint public genesisPeriodEnd;
	address public genesisGroup;
	bool public hasGenesisGroupCompleted = false;

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

	function completeGenesisGroup() external {
		require(!isGenesisPeriod() && msg.sender == genesisGroup, "Core: Still in Genesis Period or caller is not Genesis Group");
		hasGenesisGroupCompleted = true;
	}

	function isGenesisPeriod() public view returns(bool) {
		return now < genesisPeriodEnd;
	}
}

