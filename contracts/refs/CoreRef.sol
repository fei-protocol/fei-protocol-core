pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/IFei.sol";
import "../core/ICore.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract CoreRef {
	ICore private _core;

	event CoreUpdate(address indexed core);

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

	modifier onlyCore() {
		require(msg.sender == address(_core), "CoreRef: Caller is not core");
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

	function setCore(address core) public onlyGovernor {
		_core = ICore(core);
		emit CoreUpdate(core);
	}
 
	function core() public view returns(ICore) {
		return _core;
	}

	function fei() public view returns(IFei) {
		return _core.fei();
	}

	function tribe() public view returns(IERC20) {
		return _core.tribe();
	}

    function burnFeiHeld() internal {
    	fei().burn(feiBalance());
    }

    function mintFei(uint256 amount) internal {
		fei().mint(address(this), amount);
	}

	function feiBalance() internal view returns (uint) {
		return fei().balanceOf(address(this));
	}

	function tribeBalance() internal view returns (uint) {
		return tribe().balanceOf(address(this));
	}
}