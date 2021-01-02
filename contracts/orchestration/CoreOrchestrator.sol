pragma solidity ^0.6.0;

import "../core/Core.sol";
import "../oracle/UniswapOracle.sol";
import "../token/IFei.sol";
import "../refs/IOracleRef.sol";
import "../token/IUniswapIncentive.sol";
import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IBondingCurveOrchestrator {
	function init(
		address core, 
		address uniswapOracle, 
		address pair, 
		address router
	) external returns(
		address ethUniswapPCVDeposit,
		address ethBondingCurve,
		address bondingCurveOracle
	);

	function detonate() external;
}

interface IIncentiveOrchestrator {
	function init(
		address core, 
		address bondingCurveOracle, 
		address fei, 
		address router
	) external returns(address uniswapIncentive);
	function detonate() external;
}

interface IControllerOrchestrator {
	function init(
		address core, 
		address bondingCurveOracle, 
		address uniswapIncentive, 
		address ethUniswapPCVDeposit, 
		address fei, 
		address router
	) external returns(address ethUniswapPCVController);
	function detonate() external;
}

interface IIDOOrchestrator {
	function init(
		address core, 
		address admin, 
		address tribe, 
		address pair, 
		address router
	) external returns (
		address ido,
		address timelockedDelegator
	);
	function detonate() external;
}

interface IGenesisOrchestrator {
	function init(
		address core, 
		address ethBondingCurve, 
		address ido,
		address tribeFeiPair
	) external returns (address genesisGroup, address pool);
	function detonate() external;
}

interface IGovernanceOrchestrator {
	function init(address admin, address tribe) external returns (
		address governorAlpha, 
		address timelock
	);
	function detonate() external;
}

// solhint-disable-next-line max-states-count
contract CoreOrchestrator is Ownable {
	address public admin;

	address public constant ETH_USDC_UNI_PAIR = address(0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc);
	address public constant ROUTER = address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

	address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
	IUniswapV2Factory public constant UNISWAP_FACTORY = IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

	address public ethFeiPair;
	address public tribeFeiPair;

	uint32 public constant UNI_ORACLE_TWAP_DURATION = 10 minutes; // 10 min twap
	// uint32 public constant UNI_ORACLE_TWAP_DURATION = 1 // TEST MODE
	bool public constant USDC_PER_ETH_IS_PRICE_0 = true;
	address public uniswapOracle;
	uint public tribeSupply;
	uint public constant IDO_TRIBE_PERCENTAGE = 20;
	uint public constant GENESIS_TRIBE_PERCENTAGE = 10;
	uint public constant DEV_TRIBE_PERCENTAGE = 20;
	uint public constant STAKING_TRIBE_PERCENTAGE = 20;

	// Orchestrators
	IBondingCurveOrchestrator private bcOrchestrator;
	IIncentiveOrchestrator private incentiveOrchestrator;
	IControllerOrchestrator private controllerOrchestrator;
	IIDOOrchestrator private idoOrchestrator;
	IGenesisOrchestrator private genesisOrchestrator;
	IGovernanceOrchestrator private governanceOrchestrator;
	
	// Contracts
	Core public core;
	address public fei;
	address public tribe;

	address public ethUniswapPCVDeposit;
	address public ethBondingCurve;
	address public bondingCurveOracle;

	address public uniswapIncentive;

	address public ethUniswapPCVController;

	address public ido;
	address public timelockedDelegator;

	address public genesisGroup;
	address public pool;

	address public governorAlpha;
	address public timelock;

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
		(ethUniswapPCVDeposit,
		 ethBondingCurve,
		 bondingCurveOracle) = bcOrchestrator.init(address(core), uniswapOracle, ethFeiPair, ROUTER);
		core.grantMinter(ethUniswapPCVDeposit);
		core.grantMinter(ethBondingCurve);
		IOracleRef(ethUniswapPCVDeposit).setOracle(bondingCurveOracle);
		bcOrchestrator.detonate();
	}

	function initIncentive() public onlyOwner {
		uniswapIncentive = incentiveOrchestrator.init(
			address(core), 
			bondingCurveOracle, 
			ethFeiPair,
			ROUTER
		);
		core.grantMinter(uniswapIncentive);
		core.grantBurner(uniswapIncentive);
		IFei(fei).setIncentiveContract(ethFeiPair, uniswapIncentive);
		incentiveOrchestrator.detonate();
	}

	function initController() public onlyOwner {
		ethUniswapPCVController = controllerOrchestrator.init(
			address(core), 
			bondingCurveOracle, 
			uniswapIncentive, 
			ethUniswapPCVDeposit, 
			ethFeiPair,
			ROUTER
		);
		core.grantMinter(ethUniswapPCVController);
		core.grantPCVController(ethUniswapPCVController);
		IUniswapIncentive(uniswapIncentive).setExemptAddress(ethUniswapPCVDeposit, true);
		IUniswapIncentive(uniswapIncentive).setExemptAddress(ethUniswapPCVController, true);
		controllerOrchestrator.detonate();
	}

	function initIDO() public onlyOwner {
		(ido, timelockedDelegator) = idoOrchestrator.init(address(core), admin, tribe, tribeFeiPair, ROUTER);
		core.grantMinter(ido);
		core.allocateTribe(ido, tribeSupply * IDO_TRIBE_PERCENTAGE / 100);
		core.allocateTribe(timelockedDelegator, tribeSupply * DEV_TRIBE_PERCENTAGE / 100);
		idoOrchestrator.detonate();
	}

	function initGenesis() public onlyOwner {
		(genesisGroup, pool) = genesisOrchestrator.init(
			address(core), 
			ethBondingCurve, 
			ido,
			tribeFeiPair
		);
		core.setGenesisGroup(genesisGroup);
		core.allocateTribe(genesisGroup, tribeSupply * GENESIS_TRIBE_PERCENTAGE / 100);
		core.allocateTribe(pool, tribeSupply * STAKING_TRIBE_PERCENTAGE / 100);
		genesisOrchestrator.detonate();
	}

	function initGovernance() public onlyOwner {
		(governorAlpha, timelock) = governanceOrchestrator.init(
			admin, 
			tribe
		);
		governanceOrchestrator.detonate();
	}

	function launchGovernance() public {
		require(msg.sender == core.genesisGroup(), "CoreOrchestrator: Caller is not GenesisGroup");
		require(core.hasGenesisGroupCompleted(), "CoreOrchestrator: Still in Genesis Period");
		core.grantGovernor(timelock);
		// core.grantGovernor(admin); // TEST MODE
	}
}