pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/IFii.sol";

interface ICore {
	function isBurner(address _address) external view returns (bool);
	function isMinter(address _address) external view returns (bool);
	function isGovernor(address _address) external view returns (bool);
	function isReclaimer(address _address) external view returns (bool);
	function fii() external view returns (IFii);
}

contract CoreRef {
	ICore private CORE;

	constructor(address core) public {
		CORE = ICore(core);
	}

	modifier onlyMinter() {
		require(CORE.isMinter(msg.sender), "Caller is not a minter");
		_;
	}

	modifier onlyBurner() {
		require(CORE.isBurner(msg.sender), "Caller is not a burner");
		_;
	}

	modifier onlyReclaimer() {
		require(CORE.isReclaimer(msg.sender), "Caller is not a reclaimer");
		_;
	}

	modifier onlyGovernor() {
		require(CORE.isGovernor(msg.sender), "Caller is not a governor");
		_;
	}

	function core() public view returns(ICore) {
		return ICore(CORE);
	}

	function fii() public view returns(IFii) {
		return CORE.fii();
	}
}