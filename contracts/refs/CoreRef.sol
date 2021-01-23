pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./ICoreRef.sol";

/// @title Abstract implementation of ICoreRef
/// @author Fei Protocol
abstract contract CoreRef is ICoreRef {
	ICore private _core;

	/// @notice CoreRef constructor
	/// @param core Fei Core to reference
	constructor(address core) public {
		_core = ICore(core);
	}

	modifier ifMinterSelf() {
		if (_core.isMinter(address(this))) {
			_;
		}
	}

	modifier ifBurnerSelf() {
		if (_core.isBurner(address(this))) {
			_;
		}
	}

	modifier onlyMinter() {
		require(_core.isMinter(msg.sender), "CoreRef: Caller is not a minter");
		_;
	}

	modifier onlyBurner() {
		require(_core.isBurner(msg.sender), "CoreRef: Caller is not a burner");
		_;
	}

	modifier onlyPCVController() {
		require(_core.isPCVController(msg.sender), "CoreRef: Caller is not a PCV controller");
		_;
	}

	modifier onlyGovernor() {
		require(_core.isGovernor(msg.sender), "CoreRef: Caller is not a governor");
		_;
	}

	modifier onlyFei() {
		require(msg.sender == address(fei()), "CoreRef: Caller is not FEI");
		_;
	}

	modifier onlyGenesisGroup() {
		require(msg.sender == _core.genesisGroup(), "CoreRef: Caller is not GenesisGroup");
		_;
	}

	modifier postGenesis() {
		require(_core.hasGenesisGroupCompleted(), "CoreRef: Still in Genesis Period");
		_;
	}

	function setCore(address core) external override onlyGovernor {
		_core = ICore(core);
		emit CoreUpdate(core);
	}
 
	function core() public view override returns(ICore) {
		return _core;
	}

	function fei() public view override returns(IFei) {
		return _core.fei();
	}

	function tribe() public view override returns(IERC20) {
		return _core.tribe();
	}

	function feiBalance() public view override returns (uint) {
		return fei().balanceOf(address(this));
	}

	function tribeBalance() public view override returns (uint) {
		return tribe().balanceOf(address(this));
	}

    function _burnFeiHeld() internal {
    	fei().burn(feiBalance());
    }

    function _mintFei(uint amount) internal {
		fei().mint(address(this), amount);
	}
}