pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./Permissions.sol";
import "../dao/Tribe.sol";
import "../token/IFei.sol";
import "../token/Fei.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Core is Permissions {

	IFei public fei;
	IERC20 public tribe;
	address public genesisGroup;
	bool public hasGenesisGroupCompleted;

    event FeiUpdate(address indexed _fei);
    event TribeAllocation(address indexed _to, uint _amount);
    event GenesisPeriodComplete(uint _timestamp);

	constructor() public {
		_setupGovernor(msg.sender);
		_setupGovernor(address(this));
		Fei _fei = new Fei(address(this));
		fei = IFei(address(_fei));

		Tribe _tribe = new Tribe(address(this));
		tribe = IERC20(address(_tribe));
	}

	function setFei(address token) public onlyGovernor {
		fei = IFei(token);
		emit FeiUpdate(token);
	}

	function setGenesisGroup(address _genesisGroup) public onlyGovernor {
		genesisGroup = _genesisGroup;
	}

	function allocateTribe(address to, uint amount) public onlyGovernor {
		IERC20 _tribe = tribe;
		require(_tribe.balanceOf(address(this)) > amount, "Core: Not enough Tribe");
		_tribe.transfer(to, amount);
		emit TribeAllocation(to, amount);
	}

	function completeGenesisGroup() external {
		require(!hasGenesisGroupCompleted, "Core: Genesis Group already complete");
		require(msg.sender == genesisGroup, "Core: Caller is not Genesis Group");
		hasGenesisGroupCompleted = true;
		// solhint-disable-next-line not-rely-on-time
		emit GenesisPeriodComplete(now);
	}
}

