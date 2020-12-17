pragma solidity ^0.6.0;

import "../core/Core.sol";
import "../oracle/UniswapOracle.sol";
import "../pcv/IUniswapPCVDeposit.sol";
import "../token/IUniswapIncentive.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBondingCurveOrchestrator {
	function ethUniswapPCVDeposit() external view returns(address);
	function ethBondingCurve() external view returns(address);
	function init(address core, address uniswapOracle) external;
}

interface IIncentiveOrchestrator {
	function uniswapIncentive() external view returns(address);
	function bondingCurveOracle() external view returns(address);
	function ethUniswapPCVController() external view returns(address);
	function init(address core, address uniswapOracle, address ethBondingCurve, address ethUniswapPCVDeposit) external;
}

interface IGovernanceOrchestrator {
	function governorAlpha() external view returns(address);
	function timelock() external view returns(address);
	function init(address admin, address tribe) external;
}

interface IGenesisOrchestrator {
	function genesisGroup() external view returns(address);
	function pool() external view returns(address);
	function init(address core, address ethBondingCurve, address ido) external;
}

interface IIDOOrchestrator {
	function ido() external view returns(address);
	function timelockedDelegator() external view returns(address);
	function init(address core, address admin, address tribe) external;
}

interface IUniRef {
	function setPair(address pair) external;
}

contract CoreOrchestrator is Ownable {
	address public admin;

	Core public core;
	address public fei;
	address public tribe;
	address public constant ETH_USDC_UNI_PAIR = address(0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc);
	uint32 public constant UNI_ORACLE_TWAP_DURATION = 10 minutes; // 10 min twap
	bool public constant USDC_PER_ETH_IS_PRICE_0 = true;
	address public uniswapOracle;
	uint public constant GENESIS_DURATION = 4 weeks;
	uint public tribeSupply;
	uint public constant IDO_TRIBE_PERCENTAGE = 20;
	uint public constant GENESIS_TRIBE_PERCENTAGE = 10;
	uint public constant DEV_TRIBE_PERCENTAGE = 20;
	uint public constant STAKING_TRIBE_PERCENTAGE = 20;

	IBondingCurveOrchestrator private bcOrchestrator;
	IIncentiveOrchestrator private incentiveOrchestrator;
	IIDOOrchestrator private idoOrchestrator;
	IGenesisOrchestrator private genesisOrchestrator;
	IGovernanceOrchestrator private governanceOrchestrator;
	
	constructor(
		address _bcOrchestrator, 
		address _incentiveOrchestrator, 
		address _idoOrchestrator,
		address _genesisOrchestrator, 
		address _governanceOrchestrator,
		address _admin
	) public {
		core = new Core();
		tribe = address(core.tribe());
		fei = address(core.fei());
		uniswapOracle = address(new UniswapOracle(address(core), 
			ETH_USDC_UNI_PAIR, 
			UNI_ORACLE_TWAP_DURATION, 
			USDC_PER_ETH_IS_PRICE_0
		));
		core.grantRevoker(_admin);
		bcOrchestrator = IBondingCurveOrchestrator(_bcOrchestrator);
		incentiveOrchestrator = IIncentiveOrchestrator(_incentiveOrchestrator);
		idoOrchestrator = IIDOOrchestrator(_idoOrchestrator);
		genesisOrchestrator = IGenesisOrchestrator(_genesisOrchestrator);
		governanceOrchestrator = IGovernanceOrchestrator(_governanceOrchestrator);
		admin = _admin;
		tribeSupply = IERC20(tribe).totalSupply();
	}

	function initBondingCurve() public onlyOwner {
		bcOrchestrator.init(address(core), uniswapOracle);
		core.grantMinter(bcOrchestrator.ethUniswapPCVDeposit());
		core.grantMinter(bcOrchestrator.ethBondingCurve());
	}

	function initIncentive() public onlyOwner {
		address ethUniswapPCVDeposit = bcOrchestrator.ethUniswapPCVDeposit();
		address ethBondingCurve = bcOrchestrator.ethBondingCurve();
		incentiveOrchestrator.init(address(core), uniswapOracle, ethBondingCurve, ethUniswapPCVDeposit);
		address uniswapIncentive = incentiveOrchestrator.uniswapIncentive();
		core.grantMinter(uniswapIncentive);
		core.grantBurner(uniswapIncentive);
		address pair = address(IUniswapPCVDeposit(ethUniswapPCVDeposit).pair());
		address ethUniswapPCVController = incentiveOrchestrator.ethUniswapPCVController();
		IUniRef(uniswapIncentive).setPair(pair);
		core.grantMinter(ethUniswapPCVController);
		core.grantPCVController(ethUniswapPCVController);
		IUniswapIncentive(uniswapIncentive).setExemptAddress(ethUniswapPCVDeposit, true);
		IUniswapIncentive(uniswapIncentive).setExemptAddress(ethUniswapPCVController, true);
	}

	function initIDO() public onlyOwner {
		idoOrchestrator.init(address(core), admin, tribe);
		address ido = idoOrchestrator.ido();
		core.grantMinter(ido);
		core.allocateTribe(ido, tribeSupply * IDO_TRIBE_PERCENTAGE / 100);
		core.allocateTribe(idoOrchestrator.timelockedDelegator(), tribeSupply * DEV_TRIBE_PERCENTAGE / 100);
	}

	function initGenesis() public onlyOwner {
		genesisOrchestrator.init(
			address(core), 
			bcOrchestrator.ethBondingCurve(), 
			idoOrchestrator.ido()
		);
		address genesisGroup = genesisOrchestrator.genesisGroup();
		core.setGenesisGroup(genesisGroup);
		//solhint-disable-next-line not-rely-on-time
		core.setGenesisPeriodEnd(now + GENESIS_DURATION);
		core.allocateTribe(genesisGroup, tribeSupply * GENESIS_TRIBE_PERCENTAGE / 100);
		address pool = genesisOrchestrator.pool();
		core.allocateTribe(pool, tribeSupply * STAKING_TRIBE_PERCENTAGE / 100);
	}

	function initGovernance() public onlyOwner {
		governanceOrchestrator.init(
			admin, 
			tribe
		);
		core.grantGovernor(governanceOrchestrator.timelock());
	}
}