pragma solidity ^0.6.0;

import "../core/Core.sol";
import "../oracle/UniswapOracle.sol";
// import "../mock/MockOracle.sol";
import "../token/IFei.sol";
import "../pcv/IUniswapPCVDeposit.sol";
import "../token/IUniswapIncentive.sol";
import '@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol';
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBondingCurveOrchestrator {
	function ethUniswapPCVDeposit() external view returns(address);
	function ethBondingCurve() external view returns(address);
	function bondingCurveOracle() external view returns(address);
	function init(address core, address uniswapOracle, address pair, address router) external;
}

interface IIncentiveOrchestrator {
	function uniswapIncentive() external view returns(address);
	function init(address core, address bondingCurveOracle, address fei, address router) external;
}

interface IControllerOrchestrator {
	function ethUniswapPCVController() external view returns(address);
	function init(address core, address bondingCurveOracle, address uniswapIncentive, address ethUniswapPCVDeposit, address fei, address router) external;
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
	function init(address core, address admin, address tribe, address pair, address router) external;
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
	address public constant ROUTER = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

	address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
	IUniswapV2Factory public constant UNISWAP_FACTORY = IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

	address public ethFeiPair;
	address public tribeFeiPair;

	uint32 public constant UNI_ORACLE_TWAP_DURATION = 10 minutes; // 10 min twap
	bool public constant USDC_PER_ETH_IS_PRICE_0 = true;
	address public uniswapOracle;
	uint public tribeSupply;
	uint public constant IDO_TRIBE_PERCENTAGE = 20;
	uint public constant GENESIS_TRIBE_PERCENTAGE = 10;
	uint public constant DEV_TRIBE_PERCENTAGE = 20;
	uint public constant STAKING_TRIBE_PERCENTAGE = 20;

	IBondingCurveOrchestrator private bcOrchestrator;
	IIncentiveOrchestrator private incentiveOrchestrator;
	IControllerOrchestrator private controllerOrchestrator;
	IIDOOrchestrator private idoOrchestrator;
	IGenesisOrchestrator private genesisOrchestrator;
	IGovernanceOrchestrator private governanceOrchestrator;
	
	constructor(
		address _bcOrchestrator, 
		address _incentiveOrchestrator, 
		address _controllerOrchestrator,
		address _idoOrchestrator,
		address _genesisOrchestrator, 
		address _governanceOrchestrator,
		address _admin
	) public {
		core = new Core();
		tribe = address(core.tribe());
		fei = address(core.fei());

		// uniswapOracle = address(new MockOracle(500));

		uniswapOracle = address(new UniswapOracle(address(core), 
			ETH_USDC_UNI_PAIR, 
			UNI_ORACLE_TWAP_DURATION, 
			USDC_PER_ETH_IS_PRICE_0
		));

		core.grantRevoker(_admin);
		bcOrchestrator = IBondingCurveOrchestrator(_bcOrchestrator);
		incentiveOrchestrator = IIncentiveOrchestrator(_incentiveOrchestrator);
		idoOrchestrator = IIDOOrchestrator(_idoOrchestrator);
		controllerOrchestrator = IControllerOrchestrator(_controllerOrchestrator);
		genesisOrchestrator = IGenesisOrchestrator(_genesisOrchestrator);
		governanceOrchestrator = IGovernanceOrchestrator(_governanceOrchestrator);
		admin = _admin;
		tribeSupply = IERC20(tribe).totalSupply();
	}

	function initPairs() public onlyOwner {
		ethFeiPair = UNISWAP_FACTORY.createPair(fei, WETH);
		tribeFeiPair = UNISWAP_FACTORY.createPair(tribe, fei);
	}

	function initBondingCurve() public onlyOwner {
		bcOrchestrator.init(address(core), uniswapOracle, ethFeiPair, ROUTER);
		core.grantMinter(bcOrchestrator.ethUniswapPCVDeposit());
		core.grantMinter(bcOrchestrator.ethBondingCurve());
	}

	function initIncentive() public onlyOwner {
		address bondingCurveOracle = bcOrchestrator.bondingCurveOracle();
		incentiveOrchestrator.init(
			address(core), 
			bondingCurveOracle, 
			ethFeiPair,
			ROUTER
		);
		address uniswapIncentive = incentiveOrchestrator.uniswapIncentive();
		core.grantMinter(uniswapIncentive);
		core.grantBurner(uniswapIncentive);
		IFei(fei).setIncentiveContract(ethFeiPair, uniswapIncentive);
	}

	function initController() public onlyOwner {
		address ethUniswapPCVDeposit = bcOrchestrator.ethUniswapPCVDeposit();
		address bondingCurveOracle = bcOrchestrator.bondingCurveOracle();
		address uniswapIncentive = incentiveOrchestrator.uniswapIncentive();
		controllerOrchestrator.init(
			address(core), 
			bondingCurveOracle, 
			uniswapIncentive, 
			ethUniswapPCVDeposit, 
			ethFeiPair,
			ROUTER
		);
		address ethUniswapPCVController = controllerOrchestrator.ethUniswapPCVController();
		core.grantMinter(ethUniswapPCVController);
		core.grantPCVController(ethUniswapPCVController);
		IUniswapIncentive(uniswapIncentive).setExemptAddress(ethUniswapPCVDeposit, true);
		IUniswapIncentive(uniswapIncentive).setExemptAddress(ethUniswapPCVController, true);
	}

	function initIDO() public onlyOwner {
		idoOrchestrator.init(address(core), admin, tribe, tribeFeiPair, ROUTER);
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