pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./Permissions.sol";
import "./ICore.sol";
import "../token/IFei.sol";
import "../token/Fei.sol";
import "../dao/Tribe.sol";

/// @title ICore implementation
/// @author Fei Protocol
contract Core is ICore, Permissions {

	IFei public override fei;
	IERC20 public override tribe;

	address public override genesisGroup;
	bool public override hasGenesisGroupCompleted;

	constructor() public {
		_setupGovernor(msg.sender);
		Fei _fei = new Fei(address(this));
		fei = IFei(address(_fei));

		Tribe _tribe = new Tribe(address(this), msg.sender);
		tribe = IERC20(address(_tribe));
	}

	function setFei(address token) external override onlyGovernor {
		fei = IFei(token);
		emit FeiUpdate(token);
	}

	function setGenesisGroup(address _genesisGroup) external override onlyGovernor {
		genesisGroup = _genesisGroup;
	}

	function allocateTribe(address to, uint amount) external override onlyGovernor {
		IERC20 _tribe = tribe;
		require(_tribe.balanceOf(address(this)) > amount, "Core: Not enough Tribe");

		_tribe.transfer(to, amount);

		emit TribeAllocation(to, amount);
	}

	function completeGenesisGroup() external override {
		require(!hasGenesisGroupCompleted, "Core: Genesis Group already complete");
		require(msg.sender == genesisGroup, "Core: Caller is not Genesis Group");

		hasGenesisGroupCompleted = true;

		// solhint-disable-next-line not-rely-on-time
		emit GenesisPeriodComplete(now);
	}
}

