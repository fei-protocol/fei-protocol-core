pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/IFei.sol";

interface ICore {
	function isBurner(address _address) external view returns (bool);
	function isMinter(address _address) external view returns (bool);
	function isGovernor(address _address) external view returns (bool);
	function isPCVController(address _address) external view returns (bool);
	function fei() external view returns (IFei);
	function isGenesisPeriod() external view returns(bool);
	function genesisGroup() external view returns(address);
}

contract CoreRef {
	ICore internal CORE;

	constructor(address core) public {
		CORE = ICore(core);
	}

	modifier ifMinterSelf() {
		if (CORE.isMinter(address(this))) {
			_;
		}
	}

	modifier ifBurnerSelf() {
		if (CORE.isBurner(address(this))) {
			_;
		}
	}

	modifier onlyMinter() {
		require(CORE.isMinter(msg.sender), "CoreRef: Caller is not a minter");
		_;
	}

	modifier onlyBurner() {
		require(CORE.isBurner(msg.sender), "CoreRef: Caller is not a burner");
		_;
	}

	modifier onlyPCVController() {
		require(CORE.isPCVController(msg.sender), "CoreRef: Caller is not a PCV controller");
		_;
	}

	modifier onlyGovernor() {
		require(CORE.isGovernor(msg.sender), "CoreRef: Caller is not a governor");
		_;
	}

	modifier onlyCore() {
		require(msg.sender == address(CORE), "CoreRef: Caller is not core");
		_;
	}

	modifier onlyFei() {
		require(msg.sender == address(fei()), "CoreRef: Caller is not FEI");
		_;
	}

	modifier onlyGenesis() {
		require(CORE.isGenesisPeriod() && msg.sender == address(CORE.genesisGroup()), "CoreRef: Not in Genesis Period or caller is not Genesis Group");
		_;
	}

	modifier postGenesis() {
		require(!CORE.isGenesisPeriod(), "CoreRef: Still in Genesis Period");
		_;
	}
 
	function core() public view returns(ICore) {
		return ICore(CORE);
	}

	function fei() public view returns(IFei) {
		return CORE.fei();
	}

    function burnFeiHeld() internal {
    	uint256 balance = fei().balanceOf(address(this));
    	fei().burn(balance);
    }
}