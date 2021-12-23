import { DependencyMap } from '@custom-types/types';

const dependencies: DependencyMap = {
  collateralizationOracleGuardian: {
    contractDependencies: ['core']
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
      'collateralizationOracleWrapperImpl',
      'staticPcvDepositWrapper2',
      'balUsdCompositeOracle',
      'chainlinkBALEthOracle',
      'chainlinkCREAMEthOracle',
      'chainlinkDaiUsdOracleWrapper',
      'chainlinkDpiUsdOracleWrapper',
      'chainlinkEthUsdOracleWrapper',
      'chainlinkEurUsdOracleWrapper',
      'chainlinkFeiEthOracleWrapper',
      'chainlinkLUSDOracle',
      'chainlinkRaiEthOracleWrapper',
      'chainlinkRaiUsdCompositOracle',
      'chainlinkTribeEthOracle',
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
      'tribalChiefImpl'
    ]
  },
  fei: {
    contractDependencies: ['core', 'rariPool8Fei', 'feiDAOTimelock']
  },
  feiTribeLBPSwapper: {
    contractDependencies: ['core']
  },
  optimisticMinter: {
    contractDependencies: ['core']
  },
  pcvEquityMinter: {
    contractDependencies: ['core']
  },
  pcvGuardian: {
    contractDependencies: ['core']
  },
  proxyAdmin: {
    contractDependencies: ['feiDAOTimelock'] // NOTE this is slightly misleading as proxy admin needs to update admin to new timelock
  },
  ratioPCVController: {
    contractDependencies: ['core']
  },
  tribe: {
    contractDependencies: ['core', 'rariPool8Tribe', 'feiDAO', 'tribeRariDAO']
  },
  tribeMinter: {
    contractDependencies: ['core']
  },
  feiDAO: {
    contractDependencies: ['feiDAOTimelock', 'tribe']
  },
  feiDAOTimelock: {
    contractDependencies: ['core', 'feiDAO', 'fei', 'proxyAdmin', 'creamDepositWrapper', 'balDepositWrapper']
  },
  guardian: {
    contractDependencies: ['core'] // TODO do we want to document everything the guardian can affect. I think this should only reflect guardian-exclusive actions
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
      'optimisticMultisig'
    ]
  },
  rariTimelock: {
    contractDependencies: ['tribeRariDAO']
  },
  tribeRariDAO: {
    contractDependencies: ['rariTimelock', 'tribe']
  },
  aaveEthPCVDripController: {
    contractDependencies: ['core']
  },
  bondingCurve: {
    contractDependencies: ['core']
  },
  compoundEthPCVDripController: {
    contractDependencies: ['core']
  },
  daiBondingCurve: {
    contractDependencies: ['core']
  },
  daiPCVDripController: {
    contractDependencies: ['core']
  },
  daiPSM: {
    contractDependencies: ['core']
  },
  ethReserveStabilizer: {
    contractDependencies: ['core']
  },
  tribeReserveStabilizer: {
    contractDependencies: ['core']
  },
  aaveEthPCVDeposit: {
    contractDependencies: ['core']
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
    contractDependencies: ['core']
  },
  compoundEthPCVDeposit: {
    contractDependencies: ['core']
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
    contractDependencies: []
  },
  aaveFeiPCVDepositWrapper: {
    contractDependencies: []
  },
  aaveRaiPCVDepositWrapper: {
    contractDependencies: []
  },
  balDepositWrapper: {
    contractDependencies: ['feiDAOTimelock']
  },
  collateralizationOracle: {
    contractDependencies: ['core']
  },
  collateralizationOracleWrapper: {
    contractDependencies: ['core']
  },
  collateralizationOracleWrapperImpl: {
    contractDependencies: ['core']
  },
  compoundDaiPCVDepositWrapper: {
    contractDependencies: []
  },
  compoundEthPCVDepositWrapper: {
    contractDependencies: []
  },
  creamDepositWrapper: {
    contractDependencies: ['feiDAOTimelock']
  },
  creamFeiPCVDepositWrapper: {
    contractDependencies: []
  },
  daiBondingCurveWrapper: {
    contractDependencies: []
  },
  ethLidoPCVDepositWrapper: {
    contractDependencies: []
  },
  ethReserveStabilizerWrapper: {
    contractDependencies: []
  },
  feiBuybackLens: {
    contractDependencies: []
  },
  feiLusdLens: {
    contractDependencies: []
  },
  feiOATimelockWrapper: {
    contractDependencies: []
  },
  rariPool18FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool19DpiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool19FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool24FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool25FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool26FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool27FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool28FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool31FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool6FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool7FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool8FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool9FeiPCVDepositWrapper: {
    contractDependencies: []
  },
  rariPool9RaiPCVDepositWrapper: {
    contractDependencies: []
  },
  staticPcvDepositWrapper2: {
    contractDependencies: ['core']
  },
  balUsdCompositeOracle: {
    contractDependencies: ['core']
  },
  chainlinkBALEthOracle: {
    contractDependencies: ['core']
  },
  chainlinkCREAMEthOracle: {
    contractDependencies: ['core']
  },
  chainlinkDaiUsdOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkDpiUsdOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkEthUsdOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkEurUsdOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkFeiEthOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkLUSDOracle: {
    contractDependencies: ['core']
  },
  chainlinkRaiEthOracleWrapper: {
    contractDependencies: ['core']
  },
  chainlinkRaiUsdCompositOracle: {
    contractDependencies: ['core']
  },
  chainlinkTribeEthOracle: {
    contractDependencies: ['core']
  },
  chainlinkTribeEthOracleWrapper: {
    contractDependencies: ['core']
  },
  compositeOracle: {
    contractDependencies: ['core']
  },
  creamUsdCompositeOracle: {
    contractDependencies: ['core']
  },
  oneConstantOracle: {
    contractDependencies: ['core']
  },
  tribeUsdCompositeOracle: {
    contractDependencies: ['core']
  },
  zeroConstantOracle: {
    contractDependencies: ['core']
  },
  collateralizationOracleKeeper: {
    contractDependencies: ['core']
  },
  aaveTribeIncentivesController: {
    contractDependencies: []
  },
  aaveTribeIncentivesControllerImpl: {
    contractDependencies: []
  },
  autoRewardsDistributor: {
    contractDependencies: ['core', 'rewardsDistributorAdmin', 'tribalChiefSync', 'tribalChief', 'rariPool8Tribe']
  },
  erc20Dripper: {
    contractDependencies: ['core']
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
    contractDependencies: []
  },
  stakingTokenWrapperGROLaaS: {
    contractDependencies: []
  },
  stakingTokenWrapperKYLINLaaS: {
    contractDependencies: []
  },
  stakingTokenWrapperMStableLaaS: {
    contractDependencies: []
  },
  stakingTokenWrapperNEARLaaS: {
    contractDependencies: []
  },
  stakingTokenWrapperPoolTogetherLaaS: {
    contractDependencies: []
  },
  stakingTokenWrapperRari: {
    contractDependencies: []
  },
  stakingTokenWrapperSYNLaaS: {
    contractDependencies: []
  },
  stakingTokenWrapperUMALaaS: {
    contractDependencies: []
  },
  tribalChief: {
    contractDependencies: ['core', 'autoRewardsDistributor', 'tribalChiefSync']
  },
  tribalChiefImpl: {
    contractDependencies: ['core']
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
