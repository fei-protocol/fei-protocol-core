import { DependencyMap } from '../types/types';

const dependencies: DependencyMap = {
  angleDelegatorPCVDeposit: {
    contractDependencies: ['core', 'gaugeLensAgEurUniswapGauge']
  },
  gaugeLensAgEurUniswapGauge: {
    contractDependencies: ['angleDelegatorPCVDeposit', 'uniswapLensAgEurUniswapGauge']
  },
  uniswapLensAgEurUniswapGauge: {
    contractDependencies: ['core', 'gaugeLensAgEurUniswapGauge', 'chainlinkEurUsdOracleWrapper']
  },
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
  laTribuFeiTimelock: {
    contractDependencies: ['fei']
  },
  laTribuTribeTimelock: {
    contractDependencies: ['tribe']
  },
  core: {
    contractDependencies: [
      'raiPriceBoundPSM',
      'raiPCVDripController',
      'collateralizationOracleGuardian',
      'fei',
      'feiTribeLBPSwapper',
      'optimisticMinter',
      'pcvEquityMinter',
      'pcvGuardianNew',
      'ratioPCVControllerV2',
      'tribe',
      'tribeMinter',
      'feiDAOTimelock',
      'guardian',
      'optimisticTimelock',
      'aaveEthPCVDripController',
      'bammDeposit',
      'daiPCVDripController',
      'ethPSM',
      'lusdPSM',
      'daiFixedPricePSM',
      'lusdPCVDripController',
      'lusdPSMFeiSkimmer',
      'ethPSMFeiSkimmer',
      'tribeReserveStabilizer',
      'aaveEthPCVDeposit',
      'aaveFeiPCVDeposit',
      'aaveRaiPCVDeposit',
      'agEurAngleUniswapPCVDeposit',
      'agEurUniswapPCVDeposit',
      'balancerDepositBalWeth',
      'compoundDaiPCVDeposit',
      'compoundEthPCVDeposit',
      'd3poolConvexPCVDeposit',
      'd3poolCurvePCVDeposit',
      'ethLidoPCVDeposit',
      'ethTokemakPCVDeposit',
      'feiLusdLBPSwapper',
      'indexCoopFusePoolDpiPCVDeposit',
      'indexCoopFusePoolFeiPCVDeposit',
      'indexDelegator',
      'liquityFusePoolLusdPCVDeposit',
      'poolPartyFeiPCVDeposit',
      'rariTimelock',
      'rariPool146EthPCVDeposit',
      'rariPool18FeiPCVDeposit',
      'rariPool19DpiPCVDeposit',
      'rariPool19FeiPCVDeposit',
      'rariPool22FeiPCVDeposit',
      'rariPool24FeiPCVDeposit',
      'rariPool25FeiPCVDeposit',
      'rariPool26FeiPCVDeposit',
      'rariPool27FeiPCVDeposit',
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
      'restrictedPermissions',
      'balancerDepositFeiWeth',
      'delayedPCVMoverWethUniToBal',
      'angleDelegatorPCVDeposit',
      'uniswapLensAgEurUniswapGauge',
      'veBalDelegatorPCVDeposit',
      'uniswapLensAgEurUniswapGauge',
      'governanceMetadataRegistry',
      'nopeDAO',
      'podAdminGateway',
      'podFactory',
      'roleBastion'
    ]
  },
  fei: {
    contractDependencies: [
      'raiPriceBoundPSM',
      'raiPCVDripController',
      'core',
      'rariPool8Fei',
      'feiDAOTimelock',
      'collateralizationOracleKeeper',
      'aaveEthPCVDripController',
      'ethPSM',
      'lusdPSM',
      'daiFixedPricePSM',
      'daiPCVDripController',
      'lusdPSMFeiSkimmer',
      'aaveFeiPCVDeposit',
      'agEurAngleUniswapPCVDeposit',
      'indexCoopFusePoolFeiPCVDeposit',
      'poolPartyFeiPCVDeposit',
      'rariPool18FeiPCVDeposit',
      'rariPool19FeiPCVDeposit',
      'rariPool22FeiPCVDeposit',
      'rariPool24FeiPCVDeposit',
      'rariPool25FeiPCVDeposit',
      'rariPool26FeiPCVDeposit',
      'rariPool27FeiPCVDeposit',
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
      'rariInfraFeiTimelock',
      'reptbRedeemer',
      'laTribuFeiTimelock',
      'voltFeiSwapContract'
    ]
  },
  ethPSMFeiSkimmer: {
    contractDependencies: ['fei', 'ethPSM', 'core']
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
  pcvGuardianNew: {
    contractDependencies: [
      'core',
      'guardian',
      'feiDAOTimelock',
      'ethPSM',
      'lusdPSM',
      'daiFixedPricePSM',
      'compoundEthPCVDeposit',
      'aaveEthPCVDeposit',
      'aaveRaiPCVDeposit',
      'raiPriceBoundPSM'
    ]
  },
  raiPriceBoundPSM: {
    contractDependencies: ['core', 'fei', 'raiPCVDripController', 'pcvGuardianNew']
  },
  proxyAdmin: {
    contractDependencies: [
      'feiDAOTimelock',
      'aaveTribeIncentivesController',
      'tribalChief',
      'collateralizationOracleWrapper'
    ]
  },
  ratioPCVControllerV2: {
    contractDependencies: ['core', 'delayedPCVMoverWethUniToBal']
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
      'pegExchanger',
      'laTribuTribeTimelock',
      'nopeDAO'
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
      'wethDepositWrapper',
      'dpiDepositWrapper',
      'raiDepositWrapper',
      'agEurDepositWrapper',
      'aaveTribeIncentivesController',
      'tribeMinter',
      'timelock',
      'pcvGuardianNew',
      'pegExchanger',
      'voltFeiSwapContract',
      'voltDepositWrapper'
    ]
  },
  guardian: {
    contractDependencies: ['core', 'collateralizationOracleGuardian', 'pcvGuardianNew', 'fuseGuardian', 'fuseAdmin']
  },
  optimisticMultisig: {
    contractDependencies: ['optimisticTimelock']
  },
  opsOptimisticTimelock: {
    contractDependencies: ['votiumBriberD3pool', 'votiumBriber3Crvpool']
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
    contractDependencies: ['tribeRariDAO', 'core']
  },
  tribeRariDAO: {
    contractDependencies: ['rariTimelock', 'tribe']
  },
  aaveEthPCVDripController: {
    contractDependencies: ['core', 'fei', 'aaveEthPCVDeposit', 'ethPSM']
  },
  daiPCVDripController: {
    contractDependencies: ['core', 'fei', 'daiFixedPricePSM', 'compoundDaiPCVDeposit']
  },
  raiPCVDripController: {
    contractDependencies: ['core', 'fei', 'aaveRaiPCVDeposit', 'raiPriceBoundPSM']
  },
  daiFixedPricePSM: {
    contractDependencies: [
      'core',
      'fei',
      'compoundDaiPCVDeposit',
      'daiPCVDripController',
      'chainlinkDaiUsdOracleWrapper',
      'pcvGuardianNew'
    ]
  },
  lusdPSM: {
    contractDependencies: [
      'core',
      'fei',
      'bammDeposit',
      'chainlinkLUSDOracleWrapper',
      'pcvGuardianNew',
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
      'pcvGuardianNew',
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
    contractDependencies: ['core', 'aaveEthPCVDripController', 'pcvGuardianNew', 'ethPSM']
  },
  aaveFeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  aaveRaiPCVDeposit: {
    contractDependencies: ['core', 'pcvGuardianNew', 'raiPCVDripController']
  },
  agEurAngleUniswapPCVDeposit: {
    contractDependencies: ['core', 'fei', 'chainlinkEurUsdOracleWrapper']
  },
  agEurUniswapPCVDeposit: {
    contractDependencies: ['core', 'chainlinkEurUsdOracleWrapper']
  },
  balancerDepositBalWeth: {
    contractDependencies: ['core', 'balUsdCompositeOracle', 'chainlinkEthUsdOracleWrapper']
  },
  compoundDaiPCVDeposit: {
    contractDependencies: ['core', 'daiPCVDripController', 'daiFixedPricePSM']
  },
  compoundEthPCVDeposit: {
    contractDependencies: ['core', 'pcvGuardianNew']
  },
  d3poolConvexPCVDeposit: {
    contractDependencies: ['core']
  },
  d3poolCurvePCVDeposit: {
    contractDependencies: ['core']
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
    contractDependencies: ['core', 'fei', 'rariPool22FeiPCVDepositWrapper']
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
  rariPool31FeiPCVDeposit: {
    contractDependencies: ['core', 'fei', 'rariPool31FeiPCVDepositWrapper']
  },
  rariPool54FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool6FeiPCVDeposit: {
    contractDependencies: ['core', 'fei']
  },
  rariPool72FeiPCVDeposit: {
    contractDependencies: ['core', 'fei', 'rariPool72FeiPCVDepositWrapper']
  },
  rariPool79FeiPCVDeposit: {
    contractDependencies: ['core', 'fei', 'rariPool79FeiPCVDepositWrapper']
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
    contractDependencies: ['core', 'fei', 'rariPool90FeiPCVDepositWrapper']
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
      'wethDepositWrapper',
      'dpiDepositWrapper',
      'raiDepositWrapper',
      'agEurDepositWrapper',
      'ethLidoPCVDepositWrapper',
      'feiBuybackLens',
      'feiLusdLens',
      'feiOATimelockWrapper',
      'rariPool18FeiPCVDepositWrapper',
      'rariPool19DpiPCVDepositWrapper',
      'rariPool19FeiPCVDepositWrapper',
      'rariPool24FeiPCVDepositWrapper',
      'rariPool25FeiPCVDepositWrapper',
      'rariPool27FeiPCVDepositWrapper',
      'rariPool31FeiPCVDepositWrapper',
      'rariPool6FeiPCVDepositWrapper',
      'rariPool8FeiPCVDepositWrapper',
      'rariPool9RaiPCVDepositWrapper',
      'rariPool90FeiPCVDepositWrapper',
      'rariPool79FeiPCVDepositWrapper',
      'rariPool72FeiPCVDepositWrapper',
      'rariPool128FeiPCVDepositWrapper',
      'rariPool22FeiPCVDepositWrapper',
      'rariPool8LusdPCVDeposit',
      'rariPool8DaiPCVDeposit',
      'voltFusePCVDeposit',
      'voltOracle',
      'turboFusePCVDeposit',
      'voltDepositWrapper'
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
  wethDepositWrapper: {
    contractDependencies: ['feiDAOTimelock', 'collateralizationOracle']
  },
  dpiDepositWrapper: {
    contractDependencies: ['feiDAOTimelock', 'collateralizationOracle']
  },
  raiDepositWrapper: {
    contractDependencies: ['feiDAOTimelock', 'collateralizationOracle']
  },
  agEurDepositWrapper: {
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
  rariPool27FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool31FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle', 'rariPool31FeiPCVDeposit']
  },
  rariPool6FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle']
  },
  rariPool90FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle', 'rariPool90FeiPCVDeposit']
  },
  rariPool79FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle', 'rariPool79FeiPCVDeposit']
  },
  rariPool72FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle', 'rariPool72FeiPCVDeposit']
  },
  rariPool128FeiPCVDeposit: {
    contractDependencies: ['rariPool128FeiPCVDepositWrapper']
  },
  rariPool128FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle', 'rariPool128FeiPCVDeposit']
  },
  rariPool22FeiPCVDepositWrapper: {
    contractDependencies: ['collateralizationOracle', 'rariPool22FeiPCVDeposit']
  },
  rariPool8FeiPCVDepositWrapper: {
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
      'balancerDepositBalWeth',
      'balancerLensVeBalBal',
      'balancerLensVeBalWeth'
    ]
  },
  balancerLensVeBalBal: {
    contractDependencies: ['balUsdCompositeOracle', 'chainlinkEthUsdOracleWrapper']
  },
  chainlinkBALEthOracle: {
    contractDependencies: ['core', 'balUsdCompositeOracle']
  },
  chainlinkCREAMEthOracle: {
    contractDependencies: ['core', 'creamUsdCompositeOracle']
  },
  chainlinkDaiUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle', 'daiFixedPricePSM']
  },
  chainlinkDpiUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle']
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
      'balancerDepositBalWeth',
      'balancerDepositFeiWeth',
      'balancerLensBpt30Fei70Weth',
      'balancerLensVeBalBal',
      'balancerLensVeBalWeth'
    ]
  },
  chainlinkEurUsdOracleWrapper: {
    contractDependencies: [
      'core',
      'collateralizationOracle',
      'agEurAngleUniswapPCVDeposit',
      'agEurUniswapPCVDeposit',
      'uniswapLensAgEurUniswapGauge'
    ]
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
    contractDependencies: ['core', 'collateralizationOracle', 'balancerDepositFeiWeth', 'balancerLensBpt30Fei70Weth']
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
  votiumBriber3Crvpool: {
    contractDependencies: ['opsOptimisticTimelock']
  },
  rariPool8Comptroller: {
    contractDependencies: [
      'rariPool8Dai',
      'rariPool8Eth',
      'rariPool8Fei',
      'rariPool8Tribe',
      'rariPool8Lusd',
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
    contractDependencies: ['rariPool8Comptroller', 'rariPool8DaiIrm', 'rariPool8DaiPCVDeposit']
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
  },
  bbRedeemer: {
    contractDependencies: []
  },
  idleRedeemer: {
    contractDependencies: []
  },
  idleTranchesRedeemer: {
    contractDependencies: []
  },
  kashiRedeemer: {
    contractDependencies: []
  },
  weightedBalancerPoolManagerBase: {
    contractDependencies: []
  },
  rariChainlinkPriceOracleV3: {
    contractDependencies: []
  },
  balancerDepositFeiWeth: {
    contractDependencies: ['core', 'oneConstantOracle', 'chainlinkEthUsdOracleWrapper']
  },
  delayedPCVMoverWethUniToBal: {
    contractDependencies: ['core', 'ratioPCVControllerV2']
  },
  rariPool8DaiPCVDeposit: {
    contractDependencies: ['rariPool8Dai', 'collateralizationOracle']
  },
  rariPool8LusdPCVDeposit: {
    contractDependencies: ['rariPool8Lusd', 'collateralizationOracle']
  },
  rariPool8Lusd: {
    contractDependencies: ['rariPool8LusdPCVDeposit', 'rariPool8Comptroller']
  },
  timelock: {
    contractDependencies: ['feiDAOTimelock']
  },
  roleBastion: {
    contractDependencies: ['core']
  },
  podFactory: {
    contractDependencies: ['core', 'podExecutor', 'podAdminGateway']
  },
  podAdminGateway: {
    contractDependencies: ['core', 'podFactory', 'tribalCouncilTimelock']
  },
  podExecutor: {
    contractDependencies: ['podFactory', 'tribalCouncilTimelock']
  },
  nopeDAO: {
    contractDependencies: ['core', 'tribe']
  },
  governanceMetadataRegistry: {
    contractDependencies: ['core']
  },
  turboFusePCVDeposit: {
    contractDependencies: ['collateralizationOracle']
  },
  voltFeiSwapContract: {
    contractDependencies: ['fei', 'feiDAOTimelock']
  },
  voltDepositWrapper: {
    contractDependencies: ['volt', 'feiDAOTimelock', 'collateralizationOracle', 'voltOracle']
  },
  volt: {
    contractDependencies: ['voltDepositWrapper', 'voltOracle']
  },
  voltFusePCVDeposit: {
    contractDependencies: ['collateralizationOracle']
  },
  voltOracle: {
    contractDependencies: ['volt', 'voltDepositWrapper', 'collateralizationOracle']
  },
  tribalCouncilTimelock: {
    contractDependencies: ['podExecutor', 'tribalCouncilSafe', 'podAdminGateway']
  },
  tribalCouncilSafe: {
    contractDependencies: ['tribalCouncilTimelock']
  },
  veBalDelegatorPCVDeposit: {
    contractDependencies: ['core']
  },
  balancerLensVeBalWeth: {
    contractDependencies: ['balUsdCompositeOracle', 'chainlinkEthUsdOracleWrapper']
  },
  balancerLensBpt30Fei70Weth: {
    contractDependencies: ['oneConstantOracle', 'chainlinkEthUsdOracleWrapper']
  },
  pcvGuardian: {
    contractDependencies: []
  }
};

export default dependencies;
