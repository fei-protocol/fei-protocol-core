import { DependencyMap } from '@custom-types/types';

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
      'daiBondingCurve',
      'daiPCVDripController',
      'daiPSM',
      'ethReserveStabilizer',
      'tribeReserveStabilizer',
      'aaveEthPCVDeposit',
      'aaveFeiPCVDeposit',
      'aaveRaiPCVDeposit',
      'agEurAngleUniswapPCVDeposit',
      'compoundDaiPCVDeposit',
      'compoundEthPCVDeposit',
      'creamFeiPCVDeposit',
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
      'staticPcvDepositWrapper2',
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
      'daiBondingCurve',
      'daiPSM',
      'daiPCVDripController'
    ]
  },
  feiTribeLBPSwapper: {
    contractDependencies: ['core']
  },
  optimisticMinter: {
    contractDependencies: ['core', 'optimisticTimelock']
  },
  pcvEquityMinter: {
    contractDependencies: ['core', 'collateralizationOracleWrapper']
  },
  pcvGuardian: {
    contractDependencies: ['core', 'guardian']
  },
  proxyAdmin: {
    contractDependencies: ['feiDAOTimelock', 'aaveTribeIncentivesController'] // NOTE this is slightly misleading as proxy admin needs to update admin to new timelock
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
      'aaveTribeIncentivesController'
    ]
  },
  tribeMinter: {
    contractDependencies: ['core', 'tribeReserveStabilizer']
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
      'balDepositWrapper',
      'aaveTribeIncentivesController'
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
      'tribalChiefSync',
      'rariPool8Comptroller',
      'optimisticMultisig',
      'optimisticMinter',
      'tribalChief',
      'collateralizationOracle',
      'collateralizationOracleWrapper',
      'staticPcvDepositWrapper2'
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
  daiBondingCurve: {
    contractDependencies: ['core', 'fei', 'compoundDaiPCVDeposit', 'chainlinkDaiUsdOracleWrapper']
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
      'chainlinkDaiUsdOracleWrapper'
    ]
  },
  ethReserveStabilizer: {
    contractDependencies: [
      'core',
      'aaveEthPCVDripController',
      'compoundEthPCVDripController',
      'chainlinkEthUsdOracleWrapper'
    ]
  },
  tribeReserveStabilizer: {
    contractDependencies: ['core', 'tribeUsdCompositeOracle', 'tribeMinter', 'collateralizationOracleWrapper']
  },
  aaveEthPCVDeposit: {
    contractDependencies: ['core', 'aaveEthPCVDripController', 'bondingCurve']
  },
  aaveFeiPCVDeposit: {
    contractDependencies: ['core']
  },
  aaveRaiPCVDeposit: {
    contractDependencies: ['core']
  },
  agEurAngleUniswapPCVDeposit: {
    contractDependencies: ['core']
  },
  compoundDaiPCVDeposit: {
    contractDependencies: ['core', 'daiBondingCurve', 'daiPCVDripController', 'daiPSM']
  },
  compoundEthPCVDeposit: {
    contractDependencies: ['core', 'bondingCurve', 'compoundEthPCVDripController']
  },
  creamFeiPCVDeposit: {
    contractDependencies: ['core']
  },
  d3poolConvexPCVDeposit: {
    contractDependencies: ['core']
  },
  d3poolCurvePCVDeposit: {
    contractDependencies: ['core']
  },
  dpiUniswapPCVDeposit: {
    contractDependencies: ['core']
  },
  ethLidoPCVDeposit: {
    contractDependencies: ['core']
  },
  ethTokemakPCVDeposit: {
    contractDependencies: ['core']
  },
  feiLusdLBPSwapper: {
    contractDependencies: ['core']
  },
  indexCoopFusePoolDpiPCVDeposit: {
    contractDependencies: ['core']
  },
  indexCoopFusePoolFeiPCVDeposit: {
    contractDependencies: ['core']
  },
  indexDelegator: {
    contractDependencies: ['core']
  },
  liquityFusePoolLusdPCVDeposit: {
    contractDependencies: ['core']
  },
  poolPartyFeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool18FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool19DpiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool19FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool22FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool24FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool25FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool26FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool27FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool28FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool31FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool54FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool6FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool72FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool79FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool7FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool7LusdPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool8FeiPCVDeposit: {
    contractDependencies: ['core', 'rariPool8Fei']
  },
  rariPool90FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool91FeiPCVDeposit: {
    contractDependencies: ['core']
  },
  rariPool9FeiPCVDeposit: {
    contractDependencies: ['core']
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
    contractDependencies: ['core']
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
  balDepositWrapper: {
    contractDependencies: ['feiDAOTimelock', 'collateralizationOracle']
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
      'balDepositWrapper',
      'compoundDaiPCVDepositWrapper',
      'compoundEthPCVDepositWrapper',
      'creamDepositWrapper',
      'daiBondingCurveWrapper',
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
      'pcvEquityMinter'
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
  daiBondingCurveWrapper: {
    contractDependencies: ['collateralizationOracle']
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
  staticPcvDepositWrapper2: {
    contractDependencies: ['core', 'optimisticTimelock']
  },
  balUsdCompositeOracle: {
    contractDependencies: ['core', 'chainlinkBALEthOracle', 'chainlinkEthUsdOracleWrapper', 'collateralizationOracle']
  },
  chainlinkBALEthOracle: {
    contractDependencies: ['core', 'balUsdCompositeOracle']
  },
  chainlinkCREAMEthOracle: {
    contractDependencies: ['core', 'creamUsdCompositeOracle']
  },
  chainlinkDaiUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle', 'daiBondingCurve', 'daiPSM']
  },
  chainlinkDpiUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle']
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
      'ethReserveStabilizer'
    ]
  },
  chainlinkEurUsdOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle']
  },
  chainlinkFeiEthOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkLUSDOracleWrapper: {
    contractDependencies: ['core', 'collateralizationOracle']
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
    contractDependencies: ['core', 'rewardsDistributorAdmin', 'tribalChiefSync', 'tribalChief', 'rariPool8Tribe']
  },
  erc20Dripper: {
    contractDependencies: ['core', 'tribe', 'tribalChief']
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
  stakingTokenWrapperFOXLaaS: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperGROLaaS: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperKYLINLaaS: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperMStableLaaS: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperNEARLaaS: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperPoolTogetherLaaS: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperRari: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperSYNLaaS: {
    contractDependencies: ['tribalChief']
  },
  stakingTokenWrapperUMALaaS: {
    contractDependencies: ['tribalChief']
  },
  tribalChief: {
    contractDependencies: [
      'core',
      'autoRewardsDistributor',
      'tribalChiefSync',
      'optimisticTimelock',
      'erc20Dripper',
      'stakingTokenWrapperFOXLaaS',
      'stakingTokenWrapperGROLaaS',
      'stakingTokenWrapperKYLINLaaS',
      'stakingTokenWrapperMStableLaaS',
      'stakingTokenWrapperNEARLaaS',
      'stakingTokenWrapperPoolTogetherLaaS',
      'stakingTokenWrapperRari',
      'stakingTokenWrapperSYNLaaS',
      'stakingTokenWrapperUMALaaS',
      'tribalChiefImpl'
    ]
  },
  tribalChiefImpl: {
    contractDependencies: ['tribalChief']
  },
  tribalChiefSync: {
    contractDependencies: [
      'autoRewardsDistributor', // triggers autoRewardsDistributor after updates
      'optimisticTimelock', // executes atomic updates
      'tribalChief' // mass updates pools
    ]
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
