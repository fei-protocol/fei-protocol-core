pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../token/IFei.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface ICore {
	function isBurner(address _address) external view returns (bool);
	function isMinter(address _address) external view returns (bool);
	function isGovernor(address _address) external view returns (bool);
	function isPCVController(address _address) external view returns (bool);
	function fei() external view returns (IFei);
	function tribe() external view returns (IERC20);
	function isGenesisPeriod() external view returns(bool);
	function hasGenesisGroupCompleted() external view returns(bool);
	function genesisGroup() external view returns(address);
	function completeGenesisGroup() external;
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

	modifier onlyGenesisGroup() {
		require(msg.sender == CORE.genesisGroup(), "CoreRef: Caller is not GenesisGroup");
		_;
	}

	modifier onlyGenesisPeriod() {
		require(CORE.isGenesisPeriod(), "CoreRef: Not in Genesis Period");
		_;
	}

	modifier postGenesis() {
		require(!CORE.isGenesisPeriod() && CORE.hasGenesisGroupCompleted(), "CoreRef: Still in Genesis Period");
		_;
	}
 
	function core() public view returns(ICore) {
		return ICore(CORE);
	}

	function fei() public view returns(IFei) {
		return CORE.fei();
	}

	function tribe() public view returns(IERC20) {
		return CORE.tribe();
	}

    function burnFeiHeld() internal {
    	fei().burn(feiBalance());
    }

	function feiBalance() internal view returns (uint) {
		return fei().balanceOf(address(this));
	}

	function tribeBalance() internal view returns (uint) {
		return tribe().balanceOf(address(this));
	}

    function mintFei(uint256 amount) internal {
		fei().mint(address(this), amount);
	}
}