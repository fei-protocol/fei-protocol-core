import { DependencyMap } from '../types/types';

const dependencies: DependencyMap = {
  collateralizationOracleGuardian: {
    contractDependencies: ['core', 'guardian', 'collateralizationOracleWrapper']
  },
  restrictedPermissions: {
    contractDependencies: ['fei', 'core']
  },
  rariInfraTribeTimelock: {
    contractDependencies: ['tribe']
  },
  rariInfraFeiTimelock: {
    contractDependencies: ['fei']
  },
  core: {
    contractDependencies: [
      'collateralizationOracleGuardian',
      'fei',
      'feiTribeLBPSwapper',
      'optimisticMinter',
      'pcvEquityMinter',
      'pcvGuardian',
      'ratioPCVControllerV2',
      'tribe',
      'tribeMinter',
      'feiDAOTimelock',
      'guardian',
      'optimisticTimelock',
      'aaveEthPCVDripController',
      'bammDeposit',
      'daiPCVDripController',
      'daiPSM',
      'ethPSM',
      'lusdPSM',
      'lusdPCVDripController',
      'lusdPSMFeiSkimmer',
      'ethPSMFeiSkimmer',
      'daiPSMFeiSkimmer',
      'tribeReserveStabilizer',
      'aaveEthPCVDeposit',
      'aaveFeiPCVDeposit',
      'aaveRaiPCVDeposit',
      'agEurAngleUniswapPCVDeposit',
      'balancerDepositBalWeth',
      'compoundDaiPCVDeposit',
      'compoundEthPCVDeposit',
      'd3poolConvexPCVDeposit',
      'd3poolCurvePCVDeposit',
      'dpiUniswapPCVDeposit',
      'ethLidoPCVDeposit',
      'ethTokemakPCVDeposit',
      'feiLusdLBPSwapper',
      'indexCoopFusePoolDpiPCVDeposit',
      'indexCoopFusePoolFeiPCVDeposit',
      'indexDelegator',
      'liquityFusePoolLusdPCVDeposit',
      'poolPartyFeiPCVDeposit',
      'rariPool146EthPCVDeposit',
      'rariPool18FeiPCVDeposit',
      'rariPool19DpiPCVDeposit',
      'rariPool19FeiPCVDeposit',
      'rariPool22FeiPCVDeposit',
      'rariPool24FeiPCVDeposit',
      'rariPool25FeiPCVDeposit',
      'rariPool26FeiPCVDeposit',
      'rariPool27FeiPCVDeposit',
      'rariPool28FeiPCVDeposit',
      'rariPool31FeiPCVDeposit',
      'rariPool54FeiPCVDeposit',
      'rariPool6FeiPCVDeposit',
      'rariPool72FeiPCVDeposit',
      'rariPool79FeiPCVDeposit',
      'rariPool7FeiPCVDeposit',
      'rariPool7LusdPCVDeposit',
      'rariPool8FeiPCVDeposit',
      'rariPool90FeiPCVDeposit',
      'rariPool91FeiPCVDeposit',
      'rariPool9FeiPCVDeposit',
      'rariPool9RaiPCVDeposit',
      'reflexerStableAssetFusePoolRaiPCVDeposit',
      'tokeTokemakPCVDeposit',
      'uniswapPCVDeposit',
      'collateralizationOracle',
      'collateralizationOracleWrapper',
      'namedStaticPCVDepositWrapper',
      'balUsdCompositeOracle',
      'chainlinkBALEthOracle',
      'chainlinkCREAMEthOracle',
      'chainlinkDaiUsdOracleWrapper',
      'chainlinkDpiUsdOracleWrapper',
      'chainlinkEthUsdOracleWrapper',
      'chainlinkEurUsdOracleWrapper',
      'chainlinkFeiEthOracleWrapper',
      'chainlinkLUSDOracleWrapper',
      'chainlinkRaiEthOracleWrapper',
      'chainlinkRaiUsdCompositeOracle',
      'chainlinkTribeEthOracleWrapper',
      'compositeOracle',
      'creamUsdCompositeOracle',
      'oneConstantOracle',
      'tribeUsdCompositeOracle',
      'zeroConstantOracle',
      'collateralizationOracleKeeper',
      'autoRewardsDistributor',
      'erc20Dripper',
      'tribalChief',
      'fuseAdmin',
      'fuseGuardian',
      'restrictedPermissions'
    ]
  },
  fei: {
    contractDependencies: [
      'core',
      'rariPool8Fei',
      'feiDAOTimelock',
      'collateralizationOracleKeeper',
      'aaveEthPCVDripController',
      'daiPSM',
      'ethPSM',
      'lusdPSM',
      'daiPCVDripController',
      'lusdPSMFeiSkimmer',
      'aaveFeiPCVDeposit',
      'agEurAngleUniswapPCVDeposit',
      'dpiUniswapPCVDeposit',
      'indexCoopFusePoolFeiPCVDeposit',
      'poolPartyFeiPCVDeposit',
      'rariPool18FeiPCVDeposit',
      'rariPool19FeiPCVDeposit',
      'rariPool22FeiPCVDeposit',
      'rariPool24FeiPCVDeposit',
      'rariPool25FeiPCVDeposit',
      'rariPool26FeiPCVDeposit',
      'rariPool27FeiPCVDeposit',
      'rariPool28FeiPCVDeposit',
      'rariPool31FeiPCVDeposit',
      'rariPool54FeiPCVDeposit',
      'rariPool6FeiPCVDeposit',
      'rariPool72FeiPCVDeposit',
      'rariPool79FeiPCVDeposit',
      'rariPool7FeiPCVDeposit',
      'rariPool8FeiPCVDeposit',
      'rariPool90FeiPCVDeposit',
      'rariPool91FeiPCVDeposit',
      'rariPool9FeiPCVDeposit',
      'restrictedPermissions',
      'ethPSMFeiSkimmer',
      'daiPSMFeiSkimmer',
      'rariInfraFeiTimelock',
      'reptbRedeemer'
    ]
  },
  ethPSMFeiSkimmer: {
    contractDependencies: ['fei', 'ethPSM', 'core']
  },
  daiPSMFeiSkimmer: {
    contractDependencies: ['fei', 'daiPSM', 'core']
  },
  lusdPSMFeiSkimmer: {
    contractDependencies: ['fei', 'lusdPSM', 'core']
  },
  feiTribeLBPSwapper: {
    contractDependencies: ['core', 'pcvEquityMinter']
  },
  optimisticMinter: {
    contractDependencies: ['core', 'optimisticTimelock']
  },
  pcvEquityMinter: {
    contractDependencies: ['core', 'collateralizationOracleWrapper', 'feiTribeLBPSwapper']
  },
  pcvGuardian: {
    contractDependencies: [
      'core',
      'guardian',
      'feiDAOTimelock',
      'daiPSM',
      'ethPSM',
      'lusdPSM',
      'compoundEthPCVDeposit',
      'aaveEthPCVDeposit'
    ]
  },
  proxyAdmin: {
    contractDependencies: [
      'feiDAOTimelock',
      'aaveTribeIncentivesController',
      'tribalChief',
      'collateralizationOracleWrapper'
    ] // NOTE this is slightly misleading as proxy admin needs to update admin to new timelock
  },
  ratioPCVControllerV2: {
    contractDependencies: ['core']
  },
  tribe: {
    contractDependencies: [
      'core',
      'rariPool8Tribe',
      'feiDAO',
      'tribeRariDAO',
      'erc20Dripper',
      'aaveTribeIncentivesController',
      'tribeMinter',
      'tribeReserveStabilizer',
      'rariPool8Fei3Crv',
      'rariPool8d3',
      'rariInfraTribeTimelock',
      'pegExchanger'
    ]
  },
  tribeMinter: {
    contractDependencies: ['core', 'tribeReserveStabilizer', 'tribe', 'erc20Dripper', 'feiDAOTimelock' /* Owner */]
  },
  feiDAO: {
    contractDependencies: ['feiDAOTimelock', 'tribe']
  },
  feiDAOTimelock: {
    contractDependencies: [
      'core',
      'feiDAO',
      'fei',
      'proxyAdmin',
      'creamDepositWrapper',
      'aaveTribeIncentivesController',
      'tribeMinter',
      'pcvGuardian',
      'pegExchanger'
    ]
  },
  guardian: {
    contractDependencies: ['core', 'collateralizationOracleGuardian', 'pcvGuardian', 'fuseGuardian', 'fuseAdmin']
  },
  optimisticMultisig: {
    contractDependencies: ['optimisticTimelock']
  },
  opsOptimisticTimelock: {
    contractDependencies: ['votiumBriberD3pool']
  },
  optimisticTimelock: {
    contractDependencies: [
      'core',
      'rewardsDistributorAdmin',
      'tribalChiefSyncV2',
      'rariPool8Comptroller',
      'optimisticMultisig',
      'optimisticMinter',
      'tribalChief',
      'collateralizationOracle',
      'collateralizationOracleWrapper',
      'namedStaticPCVDepositWrapper',
      'rariPool8MasterOracle'
    ]
  },
  rariTimelock: {
    contractDependencies: ['tribeRariDAO']
  },
  tribeRariDAO: {
    contractDependencies: ['rariTimelock', 'tribe']
  },
  aaveEthPCVDripController: {
    contractDependencies: ['core', 'fei', 'aaveEthPCVDeposit', 'ethPSM']
  },
  daiPCVDripController: {
    contractDependencies: ['core', 'fei', 'daiPSM', 'compoundDaiPCVDeposit']
  },
  daiPSM: {
    contractDependencies: [
      'core',
      'fei',
      'compoundDaiPCVDeposit',
      'daiPCVDripController',
      'chainlinkDaiUsdOracleWrapper',
      'pcvGuardian',
      'daiPSMFeiSkimmer'
    ]
  },
  lusdPSM: {
    contractDependencies: [
      'core',
      'fei',
      'bammDeposit',
      'chainlinkLUSDOracleWrapper',
      'pcvGuardian',
      'lusdPCVDripController',
      'lusdPSMFeiSkimmer'
    ]
  },
  lusdPCVDripController: {
    contractDependencies: ['lusdPSM', 'core', 'bammDeposit']
  },
  bammDeposit: {
    contractDependencies: ['lusdPSM', 'core', 'lusdPCVDripController']
  },
  ethPSM: {
    contractDependencies: [
      'core',
      'fei',
      'aaveEthPCVDeposit',
      'chainlinkEthUsdOracleWrapper',
      'pcvGuardian',
      'aaveEthPCVDripController',
      'ethPSMRouter',
      'ethPSMFeiSkimmer'
    ]
  },
  ethPSMRouter: {
    contractDependencies: ['ethPSM']
  },
  tribeReserveStabilizer: {
    contractDependencies: ['core', 'tribeUsdCompositeOracle', 'tribeMinter', 'collateralizationOracleWrapper', 'tribe']
  },
  aaveEthPCVDeposit: {
    contractDependencies: ['core', 'aaveEthPCVDripController', 'pcvGuardian', 'ethPSM']
  },
  aaveFeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  aaveRaiPCVDeposit: {
    contractDependencies: ['core']
  },
  agEurAngleUniswapPCVDeposit: {
    contractDependencies: ['core', 'fei', 'chainlinkEurUsdOracleWrapper']
  },
  balancerDepositBalWeth: {
    contractDependencies: ['core', 'balUsdCompositeOracle', 'chainlinkEthUsdOracleWrapper']
  },
  compoundDaiPCVDeposit: {
    contractDependencies: ['core', 'daiPCVDripController', 'daiPSM']
  },
  compoundEthPCVDeposit: {
    contractDependencies: ['core', 'pcvGuardian']
  },
  d3poolConvexPCVDeposit: {
    contractDependencies: ['core']
  },
  d3poolCurvePCVDeposit: {
    contractDependencies: ['core']
  },
  dpiUniswapPCVDeposit: {
    contractDependencies: ['core', 'fei', 'chainlinkDpiUsdOracleWrapper']
  },
  ethLidoPCVDeposit: {
    contractDependencies: ['core']
  },
  ethTokemakPCVDeposit: {
    contractDependencies: ['core']
  },
  feiLusdLBPSwapper: {
    contractDependencies: ['core', 'chainlinkLUSDOracleWrapper']
  },
  indexCoopFusePoolDpiPCVDeposit: {
    contractDependencies: ['core']
  },
  indexCoopFusePoolFeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  indexDelegator: {
    contractDependencies: ['core']
  },
  liquityFusePoolLusdPCVDeposit: {
    contractDependencies: ['core']
  },
  poolPartyFeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool146EthPCVDeposit: {
    contractDependencies: ['core', 'rariPool146Eth']
  },
  rariPool146Comptroller: {
    contractDependencies: ['rariPool146FuseAdmin', 'rariPool146Eth']
  },
  rariPool146FuseAdmin: {
    contractDependencies: ['rariPool146Comptroller']
  },
  rariPool146Eth: {
    contractDependencies: ['rariPool146Comptroller', 'rariPool146EthPCVDeposit']
  },
  rariPool18FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool19DpiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool19FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool22FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool24FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool25FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool26FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool27FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool28FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool31FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool54FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool6FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool72FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool79FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool7FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool7LusdPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool8FeiPCVDeposit: {
    contractDependencies: ['core', 'rariPool8Fei', 'fei']
  },
  rariPool90FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool91FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool9FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool9RaiPCVDeposit: {
    contractDependencies: ['core']
  },
  reflexerStableAssetFusePoolRaiPCVDeposit: {
    contractDependencies: ['core']
  },
  tokeTokemakPCVDeposit: {
    contractDependencies: ['core']
  },
  uniswapPCVDeposit: {
    contractDependencies: ['core', 'chainlinkEthUsdOracleWrapper']
  },
  aaveEthPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  aaveFeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  aaveRaiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  collateralizationOracle: {
    contractDependencies: [
      'core',
      'optimisticTimelock',
      'balUsdCompositeOracle',
      'chainlinkDaiUsdOracleWrapper',
      'chainlinkDpiUsdOracleWrapper',
      'chainlinkEthUsdOracleWrapper',
      'chainlinkEurUsdOracleWrapper',
      'chainlinkLUSDOracleWrapper',
      'chainlinkRaiUsdCompositeOracle',
      'creamUsdCompositeOracle',
      'oneConstantOracle',
      'zeroConstantOracle',
      'aaveEthPCVDepositWrapper',
      'aaveFeiPCVDepositWrapper',
      'aaveRaiPCVDepositWrapper',
      'compoundDaiPCVDepositWrapper',
      'compoundEthPCVDepositWrapper',
      'creamDepositWrapper',
      'ethLidoPCVDepositWrapper',
      'feiBuybackLens',
      'feiLusdLens',
      'feiOATimelockWrapper',
      'rariPool18FeiPCVDepositWrapper',
      'rariPool19DpiPCVDepositWrapper',
      'rariPool19FeiPCVDepositWrapper',
      'rariPool24FeiPCVDepositWrapper',
      'rariPool25FeiPCVDepositWrapper',
      'rariPool26FeiPCVDepositWrapper',
      'rariPool27FeiPCVDepositWrapper',
      'rariPool28FeiPCVDepositWrapper',
      'rariPool31FeiPCVDepositWrapper',
      'rariPool6FeiPCVDepositWrapper',
      'rariPool7FeiPCVDepositWrapper',
      'rariPool8FeiPCVDepositWrapper',
      'rariPool9FeiPCVDepositWrapper',
      'rariPool9RaiPCVDepositWrapper'
    ]
  },
  collateralizationOracleWrapper: {
    contractDependencies: [
      'core',
      'optimisticTimelock',
      'collateralizationOracleKeeper',
      'collateralizationOracleGuardian',
      'collateralizationOracleWrapperImpl',
      'tribeReserveStabilizer',
      'pcvEquityMinter',
      'proxyAdmin'
    ]
  },
  collateralizationOracleWrapperImpl: {
    contractDependencies: ['collateralizationOracleWrapper']
  },
  compoundDaiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  compoundEthPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  creamDepositWrapper: {
    contractDependencies: ['feiDAOTimelock', 'collateralizationOracle']
  },
  ethLidoPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  feiBuybackLens: {
    contractDependencies: ['collateralizationOracle']
  },
  feiLusdLens: {
    contractDependencies: ['collateralizationOracle']
  },
  feiOATimelockWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool18FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool19DpiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool19FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool24FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool25FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool26FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool27FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool28FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool31FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool6FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool7FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool8FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool9FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool9RaiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  namedStaticPCVDepositWrapper: {
    contractDependencies: ['core', 'optimisticTimelock']
  },
  balUsdCompositeOracle: {
    contractDependencies: [
      'core',
      'chainlinkBALEthOracle',
      'chainlinkEthUsdOracleWrapper',
      'collateralizationOracle',
      'balancerDepositBalWeth'
    ]
  },
  chainlinkBALEthOracle: {
    contractDependencies: ['core', 'balUsdCompositeOracle']
  },
  chainlinkCREAMEthOracle: {
    contractDependencies: ['core', 'creamUsdCompositeOracle']
  },
  chainlinkDaiUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle', 'daiPSM']
  },
  chainlinkDpiUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle', 'dpiUniswapPCVDeposit']
  },
  chainlinkEthUsdOracleWrapper: {
    contractDependencies: [
      'core',
      'ethPSM',
      'compositeOracle',
      'tribeUsdCompositeOracle',
      'chainlinkRaiUsdCompositeOracle',
      'creamUsdCompositeOracle',
      'balUsdCompositeOracle',
      'collateralizationOracle',
      'uniswapPCVDeposit',
      'balancerDepositBalWeth'
    ]
  },
  chainlinkEurUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle', 'agEurAngleUniswapPCVDeposit']
  },
  chainlinkFeiEthOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkLUSDOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle', 'feiLusdLBPSwapper', 'lusdPSM']
  },
  chainlinkRaiEthOracleWrapper: {
    contractDependencies: ['core', 'chainlinkRaiUsdCompositeOracle']
  },
  chainlinkRaiUsdCompositeOracle: {
    contractDependencies: [
      'core',
      'chainlinkEthUsdOracleWrapper',
      'chainlinkRaiEthOracleWrapper',
      'collateralizationOracle'
    ]
  },
  chainlinkTribeEthOracleWrapper: {
    contractDependencies: ['core', 'tribeUsdCompositeOracle', 'compositeOracle']
  },
  compositeOracle: {
    contractDependencies: ['core', 'chainlinkEthUsdOracleWrapper', 'chainlinkTribeEthOracleWrapper']
  },
  creamUsdCompositeOracle: {
    contractDependencies: ['core', 'chainlinkEthUsdOracleWrapper', 'chainlinkCREAMEthOracle', 'collateralizationOracle']
  },
  oneConstantOracle: {
    contractDependencies: ['core', 'collateralizationOracle']
  },
  tribeUsdCompositeOracle: {
    contractDependencies: [
      'core',
      'chainlinkTribeEthOracleWrapper',
      'chainlinkEthUsdOracleWrapper',
      'tribeReserveStabilizer'
    ]
  },
  zeroConstantOracle: {
    contractDependencies: ['core', 'collateralizationOracle']
  },
  collateralizationOracleKeeper: {
    contractDependencies: ['core', 'collateralizationOracleWrapper', 'fei']
  },
  aaveTribeIncentivesController: {
    contractDependencies: ['aaveTribeIncentivesControllerImpl', 'tribe', 'feiDAOTimelock', 'proxyAdmin'] // NOTE uses old timelock
  },
  aaveTribeIncentivesControllerImpl: {
    contractDependencies: ['aaveTribeIncentivesController']
  },
  autoRewardsDistributor: {
    contractDependencies: ['core', 'rewardsDistributorAdmin', 'tribalChiefSyncV2', 'tribalChief', 'rariPool8Tribe']
  },
  erc20Dripper: {
    contractDependencies: ['core', 'tribe', 'tribalChief', 'tribeMinter']
  },
  rariRewardsDistributorDelegate: {
    contractDependencies: [
      'rariRewardsDistributorDelegator' // proxy
    ]
  },
  rariRewardsDistributorDelegator: {
    contractDependencies: [
      'rariPool8Tribe',
      'rariRewardsDistributorDelegate', // impl
      'rewardsDistributorAdmin', //admin
      'rariPool8Comptroller',
      'fei3CrvStakingtokenWrapper',
      'd3StakingTokenWrapper',
      'rariPool8Fei3Crv',
      'rariPool8d3',
      'feiDaiStakingTokenWrapper',
      'feiUsdcStakingTokenWrapper'
    ]
  },
  fei3CrvAutoRewardsDistributor: {
    contractDependencies: ['fei3CrvStakingtokenWrapper', 'tribalChief', 'rewardsDistributorAdmin', 'rariPool8Fei3Crv']
  },
  d3AutoRewardsDistributor: {
    contractDependencies: ['d3StakingTokenWrapper', 'tribalChief', 'rewardsDistributorAdmin', 'rariPool8d3']
  },
  feiDaiAutoRewardsDistributor: {
    contractDependencies: ['feiDaiStakingTokenWrapper', 'tribalChief', 'rewardsDistributorAdmin']
  },
  feiUsdcAutoRewardsDistributor: {
    contractDependencies: ['feiUsdcStakingTokenWrapper', 'tribalChief', 'rewardsDistributorAdmin']
  },
  fei3CrvStakingtokenWrapper: {
    contractDependencies: ['fei3CrvAutoRewardsDistributor', 'tribalChief', 'rariRewardsDistributorDelegator']
  },
  feiDaiStakingTokenWrapper: {
    contractDependencies: ['feiDaiAutoRewardsDistributor', 'tribalChief', 'rariRewardsDistributorDelegator']
  },
  feiUsdcStakingTokenWrapper: {
    contractDependencies: ['feiUsdcAutoRewardsDistributor', 'tribalChief', 'rariRewardsDistributorDelegator']
  },
  d3StakingTokenWrapper: {
    contractDependencies: ['d3AutoRewardsDistributor', 'tribalChief', 'rariRewardsDistributorDelegator']
  },
  rewardsDistributorAdmin: {
    contractDependencies: [
      'rariRewardsDistributorDelegator',
      'optimisticTimelock',
      'autoRewardsDistributor', // rewards dripper role
      'fei3CrvAutoRewardsDistributor',
      'd3AutoRewardsDistributor',
      'feiDaiAutoRewardsDistributor',
      'feiUsdcAutoRewardsDistributor'
    ]
  },
  stwBulkHarvest: {
    contractDependencies: [
      'stakingTokenWrapperFOXLaaS',
      'stakingTokenWrapperBribeD3pool',
      'stakingTokenWrapperGROLaaS',
      'stakingTokenWrapperKYLINLaaS',
      'stakingTokenWrapperMStableLaaS',
      'stakingTokenWrapperNEARLaaS',
      'stakingTokenWrapperPoolTogetherLaaS',
      'stakingTokenWrapperRari',
      'stakingTokenWrapperSYNLaaS',
      'stakingTokenWrapperUMALaaS'
    ]
  },
  stakingTokenWrapperFOXLaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperBribeD3pool: {
    contractDependencies: ['tribalChief', 'votiumBriberD3pool', 'stwBulkHarvest']
  },
  stakingTokenWrapperGROLaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperKYLINLaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperMStableLaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperNEARLaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperPoolTogetherLaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperRari: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperSYNLaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  stakingTokenWrapperUMALaaS: {
    contractDependencies: ['tribalChief', 'stwBulkHarvest']
  },
  tribalChief: {
    contractDependencies: [
      'core',
      'autoRewardsDistributor',
      'tribalChiefSyncV2',
      'optimisticTimelock',
      'erc20Dripper',
      'stakingTokenWrapperBribeD3pool',
      'stakingTokenWrapperFOXLaaS',
      'stakingTokenWrapperGROLaaS',
      'stakingTokenWrapperKYLINLaaS',
      'stakingTokenWrapperMStableLaaS',
      'stakingTokenWrapperNEARLaaS',
      'stakingTokenWrapperPoolTogetherLaaS',
      'stakingTokenWrapperRari',
      'stakingTokenWrapperSYNLaaS',
      'stakingTokenWrapperUMALaaS',
      'tribalChiefImpl',
      'proxyAdmin',
      'fei3CrvAutoRewardsDistributor',
      'd3AutoRewardsDistributor',
      'fei3CrvStakingtokenWrapper',
      'd3StakingTokenWrapper',
      'feiDaiStakingTokenWrapper',
      'feiUsdcStakingTokenWrapper',
      'feiDaiAutoRewardsDistributor',
      'feiUsdcAutoRewardsDistributor'
    ]
  },
  tribalChiefImpl: {
    contractDependencies: ['tribalChief']
  },
  tribalChiefSyncV2: {
    contractDependencies: [
      'autoRewardsDistributor', // triggers autoRewardsDistributor after updates
      'optimisticTimelock', // executes atomic updates
      'tribalChief' // mass updates pools
    ]
  },
  votiumBriberD3pool: {
    contractDependencies: ['stakingTokenWrapperBribeD3pool', 'opsOptimisticTimelock']
  },
  rariPool8Comptroller: {
    contractDependencies: [
      'rariPool8Dai',
      'rariPool8Eth',
      'rariPool8Fei',
      'rariPool8Tribe',
      'rariRewardsDistributorDelegator', // registered rewards distributor
      'optimisticTimelock', // admin
      'rariPool8MasterOracle',
      'fuseGuardian',
      'fuseAdmin',
      'rariPool8Fei3Crv',
      'rariPool8d3'
    ]
  },
  fuseAdmin: {
    contractDependencies: ['core', 'rariPool8Comptroller', 'guardian']
  },
  fuseGuardian: {
    contractDependencies: ['core', 'rariPool8Comptroller', 'guardian']
  },
  rariPool8MasterOracle: {
    contractDependencies: ['gUniFuseOracle', 'optimisticTimelock', 'rariPool8Comptroller', 'curveLPTokenOracle']
  },
  gUniFuseOracle: {
    contractDependencies: ['rariPool8MasterOracle']
  },
  curveLPTokenOracle: {
    contractDependencies: ['rariPool8MasterOracle']
  },
  rariPool8Dai: {
    contractDependencies: ['rariPool8Comptroller', 'rariPool8DaiIrm']
  },
  rariPool8DaiIrm: {
    contractDependencies: ['rariPool8Dai']
  },
  rariPool8Eth: {
    contractDependencies: ['rariPool8Comptroller', 'rariPool8EthIrm']
  },
  rariPool8EthIrm: {
    contractDependencies: ['rariPool8Eth']
  },
  rariPool8Fei: {
    contractDependencies: ['fei', 'rariPool8Comptroller', 'rariPool8FeiIrm', 'rariPool8FeiPCVDeposit']
  },
  rariPool8FeiIrm: {
    contractDependencies: ['rariPool8Fei']
  },
  rariPool8CTokenImpl: {
    contractDependencies: ['rariPool8Fei3Crv', 'rariPool8d3']
  },
  rariPool8Fei3Crv: {
    contractDependencies: [
      'rariPool8CTokenImpl',
      'tribe',
      'rariPool8Comptroller',
      'rariRewardsDistributorDelegator',
      'fei3CrvAutoRewardsDistributor'
    ]
  },
  rariPool8d3: {
    contractDependencies: [
      'rariPool8CTokenImpl',
      'tribe',
      'rariPool8Comptroller',
      'rariRewardsDistributorDelegator',
      'd3AutoRewardsDistributor'
    ]
  },
  rariPool8Tribe: {
    contractDependencies: [
      'tribe',
      'rariPool8Comptroller',
      'rariPool8TribeIrm',
      'rariRewardsDistributorDelegator', // Drips TRIBE rewards
      'autoRewardsDistributor'
    ]
  },
  rariPool8TribeIrm: {
    contractDependencies: ['rariPool8Tribe']
  },
  reptbRedeemer: {
    contractDependencies: ['fei']
  },
  pegExchanger: {
    contractDependencies: ['tribe', 'feiDAOTimelock']
  }
};

export default dependencies;
