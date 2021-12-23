import { DependencyMap } from '@custom-types/types';

const dependencies: DependencyMap = {
  collateralizationOracleGuardian: {
    contractDependencies: ['core']
  },
  core: {
    contractDependencies: []
  },
  fei: {
    contractDependencies: ['core', 'rariPool8Fei']
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
    contractDependencies: ['core']
  },
  ratioPCVController: {
    contractDependencies: ['core']
  },
  tribe: {
    contractDependencies: ['core', 'rariPool8Tribe']
  },
  tribeMinter: {
    contractDependencies: ['core']
  },
  feiDAO: {
    contractDependencies: ['core']
  },
  feiDAOTimelock: {
    contractDependencies: ['core']
  },
  guardian: {
    contractDependencies: ['core']
  },
  optimisticMultisig: {
    contractDependencies: ['core']
  },
  optimisticTimelock: {
    contractDependencies: ['core']
  },
  rariTimelock: {
    contractDependencies: ['core']
  },
  tribeRariDAO: {
    contractDependencies: ['core']
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
    contractDependencies: ['core']
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
    contractDependencies: ['core']
  },
  aaveFeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  aaveRaiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  balDepositWrapper: {
    contractDependencies: ['core']
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
    contractDependencies: ['core']
  },
  compoundEthPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  creamDepositWrapper: {
    contractDependencies: ['core']
  },
  creamFeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  daiBondingCurveWrapper: {
    contractDependencies: ['core']
  },
  ethLidoPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  ethReserveStabilizerWrapper: {
    contractDependencies: ['core']
  },
  feiBuybackLens: {
    contractDependencies: ['core']
  },
  feiLusdLens: {
    contractDependencies: ['core']
  },
  feiOATimelockWrapper: {
    contractDependencies: ['core']
  },
  rariPool18FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool19DpiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool19FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool24FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool25FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool26FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool27FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool28FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool31FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool6FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool7FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool8FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool9FeiPCVDepositWrapper: {
    contractDependencies: ['core']
  },
  rariPool9RaiPCVDepositWrapper: {
    contractDependencies: ['core']
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
    contractDependencies: ['core']
  },
  aaveTribeIncentivesControllerImpl: {
    contractDependencies: ['core']
  },
  autoRewardsDistributor: {
    contractDependencies: ['core', 'rewardsDistributorAdmin', 'tribalChiefSync']
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
      'rewardsDistributorAdmin' //admin
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
    contractDependencies: ['core']
  },
  stakingTokenWrapperGROLaaS: {
    contractDependencies: ['core']
  },
  stakingTokenWrapperKYLINLaaS: {
    contractDependencies: ['core']
  },
  stakingTokenWrapperMStableLaaS: {
    contractDependencies: ['core']
  },
  stakingTokenWrapperNEARLaaS: {
    contractDependencies: ['core']
  },
  stakingTokenWrapperPoolTogetherLaaS: {
    contractDependencies: ['core']
  },
  stakingTokenWrapperRari: {
    contractDependencies: ['core']
  },
  stakingTokenWrapperSYNLaaS: {
    contractDependencies: ['core']
  },
  stakingTokenWrapperUMALaaS: {
    contractDependencies: ['core']
  },
  tribalChief: {
    contractDependencies: ['core', 'autoRewardsDistributor']
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
    contractDependencies: ['fei', 'rariPool8Comptroller', 'rariPool8FeiIrm']
  },
  rariPool8FeiIrm: {
    contractDependencies: ['rariPool8Fei']
  },
  rariPool8Tribe: {
    contractDependencies: [
      'tribe',
      'rariPool8Comptroller',
      'rariPool8TribeIrm',
      'rariRewardsDistributorDelegator' // Drips TRIBE rewards
    ]
  },
  rariPool8TribeIrm: {
    contractDependencies: ['rariPool8Tribe']
  }
};

export default dependencies;
