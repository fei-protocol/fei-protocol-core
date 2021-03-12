pragma solidity ^0.6.0;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "../token/IUniswapIncentive.sol";
import "../token/IFei.sol";
import "../genesis/IGenesisGroup.sol";
import "../refs/IOracleRef.sol";
import "../core/ICore.sol";
import "../staking/IRewardsDistributor.sol";
import "./IOrchestrator.sol";

interface ITribe {
    function setMinter(address minter_) external;
}

// solhint-disable-next-line max-states-count
contract CoreOrchestrator is Ownable {
    address public admin;

    // ----------- Uniswap Addresses -----------
    address public constant ETH_USDC_UNI_PAIR =
        address(0xB4e16d0168e52d35CaCD2c6185b44281Ec28C9Dc);
    address public constant ROUTER =
        address(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    address public constant WETH =
        address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
    IUniswapV2Factory public constant UNISWAP_FACTORY =
        IUniswapV2Factory(0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f);

    address public ethFeiPair;
    address public tribeFeiPair;

    // ----------- Time periods -----------
    uint256 public constant TOKEN_TIMELOCK_RELEASE_WINDOW = 4 * 365 days;

    uint256 public constant DAO_TIMELOCK_DELAY = 1 days;
    uint256 public constant GENESIS_DURATION = 3 days;

    uint256 public constant STAKING_REWARDS_DURATION = 2 * 365 days;
    
    uint256 public constant STAKING_REWARDS_DRIP_FREQUENCY = 1 weeks;

    uint256 public constant THAWING_DURATION = 2 weeks;

    uint256 public constant UNI_ORACLE_TWAP_DURATION = 10 minutes; // 10 min twap

    uint256 public constant BONDING_CURVE_ALLOCATE_INCENTIVE_FREQUENCY = 1 days; // 1 day duration

    // ----------- Params -----------
    uint256 public constant GENESIS_FEI_TRIBE_EXCHANGE_RATE_DISCOUNT = 10;

    uint32 public constant INCENTIVE_GROWTH_RATE = 75; // a bit over 1 unit per 5 hours assuming 13s block time

    uint256 public constant SCALE = 100_000_000e18;
    uint256 public constant FEI_KEEPER_INCENTIVE = 500e18;

    uint256 public constant MIN_REWEIGHT_DISTANCE_BPS = 100;

    bool public constant USDC_PER_ETH_IS_PRICE_0 = false; // for the ETH_USDC pair

    uint256 public tribeSupply;
    uint256 public constant IDO_TRIBE_PERCENTAGE = 20;
    uint256 public constant GENESIS_TRIBE_PERCENTAGE = 10;
    uint256 public constant STAKING_TRIBE_PERCENTAGE = 10;

    uint256 public constant TRIBE_GRANTS_AMT = 20_000_000e18;
    uint256[9] public TRIBE_TIMELOCK_AMTS = [
        uint256(160_000_000e18),
        5_000_000e18,
        5_000_000e18,
        5_000_000e18,
        5_000_000e18,
        10e18,
        10e18,
        10e18,
        10e18
    ];

    // ----------- Orchestrators -----------
    IPCVDepositOrchestrator private pcvDepositOrchestrator;
    IBondingCurveOrchestrator private bcOrchestrator;
    IIncentiveOrchestrator private incentiveOrchestrator;
    IControllerOrchestrator private controllerOrchestrator;
    IIDOOrchestrator private idoOrchestrator;
    IGenesisOrchestrator private genesisOrchestrator;
    IGovernanceOrchestrator private governanceOrchestrator;
    IRouterOrchestrator private routerOrchestrator;
    IStakingOrchestrator private stakingOrchestrator;

    // ----------- Deployed Contracts -----------
    ICore public core;
    address public fei;
    address public tribe;
    address public feiRouter;

    address public ethUniswapPCVDeposit;
    address public ethBondingCurve;

    address public uniswapOracle;
    address public bondingCurveOracle;

    address public uniswapIncentive;

    address public ethUniswapPCVController;

    address public ido;
    address public timelockedDelegator;
    address[] public timelockedDelegators;

    address public genesisGroup;

    address public feiStakingRewards;
    address public feiRewardsDistributor;

    address public governorAlpha;
    address public timelock;

    constructor(
        address _pcvDepositOrchestrator,
        address _bcOrchestrator,
        address _incentiveOrchestrator,
        address _controllerOrchestrator,
        address _idoOrchestrator,
        address _genesisOrchestrator,
        address _governanceOrchestrator,
        address _routerOrchestrator,
        address _stakingOrchestrator,
        address _admin
    ) public {
        require(_admin != address(0), "CoreOrchestrator: no admin");

        pcvDepositOrchestrator = IPCVDepositOrchestrator(
            _pcvDepositOrchestrator
        );
        bcOrchestrator = IBondingCurveOrchestrator(_bcOrchestrator);
        incentiveOrchestrator = IIncentiveOrchestrator(_incentiveOrchestrator);
        idoOrchestrator = IIDOOrchestrator(_idoOrchestrator);
        controllerOrchestrator = IControllerOrchestrator(
            _controllerOrchestrator
        );
        genesisOrchestrator = IGenesisOrchestrator(_genesisOrchestrator);
        governanceOrchestrator = IGovernanceOrchestrator(
            _governanceOrchestrator
        );
        routerOrchestrator = IRouterOrchestrator(_routerOrchestrator);
        stakingOrchestrator = IStakingOrchestrator(_stakingOrchestrator);

        admin = _admin;
    }

    function initCore(address _core) public onlyOwner {
        core = ICore(_core);

        core.init();
        core.grantGuardian(admin);

        tribe = address(core.tribe());
        fei = address(core.fei());
        tribeSupply = IERC20(tribe).totalSupply();
    }

    function initPairs() public onlyOwner {
        ethFeiPair = UNISWAP_FACTORY.createPair(fei, WETH);
        tribeFeiPair = UNISWAP_FACTORY.createPair(tribe, fei);
    }

    function initPCVDeposit() public onlyOwner() {
        (ethUniswapPCVDeposit, uniswapOracle) = pcvDepositOrchestrator.init(
            address(core),
            ethFeiPair,
            ROUTER,
            ETH_USDC_UNI_PAIR,
            UNI_ORACLE_TWAP_DURATION,
            USDC_PER_ETH_IS_PRICE_0
        );
        core.grantMinter(ethUniswapPCVDeposit);
        pcvDepositOrchestrator.detonate();
    }

    function initBondingCurve() public onlyOwner {
        (ethBondingCurve, bondingCurveOracle) = bcOrchestrator.init(
            address(core),
            uniswapOracle,
            ethUniswapPCVDeposit,
            SCALE,
            THAWING_DURATION,
            BONDING_CURVE_ALLOCATE_INCENTIVE_FREQUENCY,
            FEI_KEEPER_INCENTIVE
        );
        core.grantMinter(ethBondingCurve);
        IOracleRef(ethUniswapPCVDeposit).setOracle(bondingCurveOracle);
        bcOrchestrator.detonate();
    }

    function initIncentive() public onlyOwner {
        uniswapIncentive = incentiveOrchestrator.init(
            address(core),
            bondingCurveOracle,
            ethFeiPair,
            ROUTER,
            INCENTIVE_GROWTH_RATE
        );
        core.grantMinter(uniswapIncentive);
        core.grantBurner(uniswapIncentive);
        IFei(fei).setIncentiveContract(ethFeiPair, uniswapIncentive);
        incentiveOrchestrator.detonate();
    }

    function initRouter() public onlyOwner {
        feiRouter = routerOrchestrator.init(ethFeiPair, WETH);
    }

    function initController() public onlyOwner {
        ethUniswapPCVController = controllerOrchestrator.init(
            address(core),
            bondingCurveOracle,
            ethUniswapPCVDeposit,
            ethFeiPair,
            ROUTER,
            FEI_KEEPER_INCENTIVE,
            MIN_REWEIGHT_DISTANCE_BPS
        );
        core.grantMinter(ethUniswapPCVController);
        core.grantPCVController(ethUniswapPCVController);

        IUniswapIncentive(uniswapIncentive).setExemptAddress(
            ethUniswapPCVDeposit,
            true
        );
        IUniswapIncentive(uniswapIncentive).setExemptAddress(
            ethUniswapPCVController,
            true
        );

        controllerOrchestrator.detonate();
    }

    function initIDO() public onlyOwner {
        (ido, timelockedDelegator) = idoOrchestrator.init(
            address(core),
            admin,
            tribe,
            tribeFeiPair,
            ROUTER,
            TOKEN_TIMELOCK_RELEASE_WINDOW
        );
        core.grantMinter(ido);
        core.allocateTribe(ido, (tribeSupply * IDO_TRIBE_PERCENTAGE) / 100);

        idoOrchestrator.detonate();
    }

    function initTimelocks(address[] memory _timelockedDelegators) public onlyOwner {
        require(timelockedDelegators.length == 0, "Already initialized");

        uint256 length = TRIBE_TIMELOCK_AMTS.length;
        require(_timelockedDelegators.length == length, "Length mismatch");

        for (uint i = 0; i < length; i++) {
            core.allocateTribe(
                _timelockedDelegators[i],
                TRIBE_TIMELOCK_AMTS[i]
            );
        }

        core.allocateTribe(
            admin,
            TRIBE_GRANTS_AMT
        );

        timelockedDelegators = _timelockedDelegators;
    }

    function initGenesis() public onlyOwner {
        (genesisGroup) = genesisOrchestrator.init(
            address(core),
            ethBondingCurve,
            ido,
            bondingCurveOracle,
            GENESIS_DURATION,
            GENESIS_FEI_TRIBE_EXCHANGE_RATE_DISCOUNT
        );
        core.setGenesisGroup(genesisGroup);
        core.allocateTribe(
            genesisGroup,
            (tribeSupply * GENESIS_TRIBE_PERCENTAGE) / 100
        );

        genesisOrchestrator.detonate();
    }

    function beginGenesis() public onlyOwner {
        IGenesisGroup(genesisGroup).initGenesis();
    }

    function initStaking() public onlyOwner {
        (feiStakingRewards, feiRewardsDistributor) = stakingOrchestrator.init(
            address(core),
            tribeFeiPair,
            tribe,
            STAKING_REWARDS_DURATION,
            STAKING_REWARDS_DRIP_FREQUENCY,
            FEI_KEEPER_INCENTIVE
        );

        core.allocateTribe(
            feiRewardsDistributor,
            (tribeSupply * STAKING_TRIBE_PERCENTAGE) / 100
        );
        core.grantMinter(feiRewardsDistributor);

        IRewardsDistributor(feiRewardsDistributor).setStakingContract(feiStakingRewards);

        stakingOrchestrator.detonate();
    }

    function initGovernance() public onlyOwner {
        (governorAlpha, timelock) = governanceOrchestrator.init(
            tribe,
            DAO_TIMELOCK_DELAY
        );
        governanceOrchestrator.detonate();
        core.grantGovernor(timelock);
        ITribe(tribe).setMinter(timelock);
    }

    function renounceGovernor() public onlyOwner {
        core.revokeGovernor(address(this));
        renounceOwnership();
    }
}
