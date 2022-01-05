import { DependencyMap } from '../types/types';

const dependencies: DependencyMap = {
  collateralizationOracleGuardian: {
    contractDependencies: ['core', 'guardian', 'collateralizationOracleWrapper']
  },
  core: {
    contractDependencies: [
      'collateralizationOracleGuardian',
      'fei',
      'feiTribeLBPSwapper',
      'optimisticMinter',
      'pcvEquityMinter',
      'pcvGuardian',
      'ratioPCVController',
      'tribe',
      'tribeMinter',
      'feiDAOTimelock',
      'guardian',
      'optimisticTimelock',
      'aaveEthPCVDripController',
      'bondingCurve',
      'compoundEthPCVDripController',
      'daiPCVDripController',
      'daiPSM',
      'ethReserveStabilizer',
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
      'tribalChief'
    ]
  },
  fei: {
    contractDependencies: [
      'core',
      'rariPool8Fei',
      'feiDAOTimelock',
      'collateralizationOracleKeeper',
      'aaveEthPCVDripController',
      'bondingCurve',
      'compoundEthPCVDripController',
      'daiPSM',
      'daiPCVDripController',
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
      'rariPool9FeiPCVDeposit'
    ]
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
      'compoundEthPCVDeposit',
      'aaveEthPCVDeposit',
      'ethReserveStabilizer'
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
  ratioPCVController: {
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
      'tribeReserveStabilizer'
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
      'pcvGuardian'
    ]
  },
  guardian: {
    contractDependencies: ['core', 'collateralizationOracleGuardian', 'pcvGuardian'] // TODO do we want to document everything the guardian can affect. I think this should only reflect guardian-exclusive actions
  },
  optimisticMultisig: {
    contractDependencies: ['optimisticTimelock']
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
      'votiumBriberD3pool'
    ]
  },
  rariTimelock: {
    contractDependencies: ['tribeRariDAO']
  },
  tribeRariDAO: {
    contractDependencies: ['rariTimelock', 'tribe']
  },
  aaveEthPCVDripController: {
    contractDependencies: ['core', 'fei', 'aaveEthPCVDeposit', 'ethReserveStabilizer']
  },
  bondingCurve: {
    contractDependencies: ['core', 'fei', 'aaveEthPCVDeposit', 'compoundEthPCVDeposit', 'chainlinkEthUsdOracleWrapper']
  },
  compoundEthPCVDripController: {
    contractDependencies: ['core', 'fei', 'compoundEthPCVDeposit', 'ethReserveStabilizer']
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
      'pcvGuardian'
    ]
  },
  ethPSM: {
    contractDependencies: [
      'core',
      'fei',
      'aaveEthPCVDeposit',
      'ethPSMAavePCVDripController',
      'chainlinkFeiEthOracleWrapper',
      'pcvGuardian'
    ]
  },
  ethPSMRouter: {
    contractDependencies: ['ethPSM']
  },
  ethReserveStabilizer: {
    contractDependencies: [
      'core',
      'aaveEthPCVDripController',
      'compoundEthPCVDripController',
      'chainlinkEthUsdOracleWrapper',
      'pcvGuardian'
    ]
  },
  tribeReserveStabilizer: {
    contractDependencies: ['core', 'tribeUsdCompositeOracle', 'tribeMinter', 'collateralizationOracleWrapper', 'tribe']
  },
  aaveEthPCVDeposit: {
    contractDependencies: ['core', 'aaveEthPCVDripController', 'bondingCurve', 'pcvGuardian']
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
    contractDependencies: ['core', 'bondingCurve', 'compoundEthPCVDripController', 'pcvGuardian']
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
      'ethReserveStabilizerWrapper',
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
  ethReserveStabilizerWrapper: {
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
      'compositeOracle',
      'tribeUsdCompositeOracle',
      'chainlinkRaiUsdCompositeOracle',
      'creamUsdCompositeOracle',
      'balUsdCompositeOracle',
      'collateralizationOracle',
      'bondingCurve',
      'ethReserveStabilizer',
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
    contractDependencies: ['core', 'collateralizationOracle', 'feiLusdLBPSwapper']
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
      'rariPool8Comptroller'
    ]
  },
  rewardsDistributorAdmin: {
    contractDependencies: [
      'rariRewardsDistributorDelegator',
      'optimisticTimelock',
      'autoRewardsDistributor' // rewards dripper role
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
      'proxyAdmin'
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
    contractDependencies: ['stakingTokenWrapperBribeD3pool', 'optimisticTimelock']
  },
  rariPool8Comptroller: {
    contractDependencies: [
      'rariPool8Dai',
      'rariPool8Eth',
      'rariPool8Fei',
      'rariPool8Tribe',
      'rariRewardsDistributorDelegator', // registered rewards distributor
      'optimisticTimelock' // admin
    ]
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
  }
};

export default dependencies;
