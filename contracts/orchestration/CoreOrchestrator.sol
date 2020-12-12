pragma solidity ^0.6.0;

import "../core/Core.sol";
import "../oracle/UniswapOracle.sol";
import "../pcv/IUniswapPCVDeposit.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
	function init(address core, address ethBondingCurve, address ido) external;
}

interface IIDOOrchestrator {
	function ido() external view returns(address);
	function init(address core, address admin) external;
}

interface IUniRef {
	function setPair(address pair) external;
}

contract CoreOrchestrator is Ownable {
	address public constant ADMIN = address(0);

	Core public core;
	address public fei;
	address public tribe;
	address public constant ETH_USDC_UNI_PAIR = address(0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc);
	uint32 public constant UNI_ORACLE_TWAP_DURATION = 10 minutes; // 10 min twap
	bool public constant USDC_PER_ETH_IS_PRICE_0 = true;
	address public uniswapOracle;
	uint public constant GENESIS_DURATION = 4 weeks;

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
		address _governanceOrchestrator
	) public {
		core = new Core();
		tribe = address(core.tribe());
		fei = address(core.fei());
		uniswapOracle = address(new UniswapOracle(address(core), 
			ETH_USDC_UNI_PAIR, 
			UNI_ORACLE_TWAP_DURATION, 
			USDC_PER_ETH_IS_PRICE_0
		));
		bcOrchestrator = IBondingCurveOrchestrator(_bcOrchestrator);
		incentiveOrchestrator = IIncentiveOrchestrator(_incentiveOrchestrator);
		idoOrchestrator = IIDOOrchestrator(_idoOrchestrator);
		genesisOrchestrator = IGenesisOrchestrator(_genesisOrchestrator);
		governanceOrchestrator = IGovernanceOrchestrator(_governanceOrchestrator);
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
		IUniRef(uniswapIncentive).setPair(pair);
		core.grantMinter(incentiveOrchestrator.ethUniswapPCVController());
		core.grantPCVController(incentiveOrchestrator.ethUniswapPCVController());
	}

	function initIDO() public onlyOwner {
		idoOrchestrator.init(address(core), ADMIN);
		core.grantMinter(idoOrchestrator.ido());
	}

	function initGenesis() public onlyOwner {
		genesisOrchestrator.init(
			address(core), 
			bcOrchestrator.ethBondingCurve(), 
			idoOrchestrator.ido()
		);
		core.setGenesisGroup(genesisOrchestrator.genesisGroup());
		core.setGenesisPeriodEnd(now + GENESIS_DURATION);
	}

	function initGovernance() public onlyOwner {
		governanceOrchestrator.init(
			ADMIN, 
			tribe
		);
		core.grantGovernor(governanceOrchestrator.timelock());
	}
}