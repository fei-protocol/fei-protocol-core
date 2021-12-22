import { DependencyMap } from '@custom-types/types';

const dependencies: DependencyMap = {
  collateralizationOracleGuardian: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  core: {
    contractDependencies: [],
    externalDependencies: []
  },
  fei: {
    contractDependencies: ['core', 'rariPool8Fei'],
    externalDependencies: []
  },
  feiTribeLBPSwapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  optimisticMinter: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  pcvEquityMinter: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  pcvGuardian: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  proxyAdmin: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  ratioPCVController: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  tribe: {
    contractDependencies: ['core', 'rariPool8Tribe'],
    externalDependencies: []
  },
  tribeMinter: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  feiDAO: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  feiDAOTimelock: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  guardian: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  optimisticMultisig: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  optimisticTimelock: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariTimelock: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  tribeRariDAO: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveEthPCVDripController: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  bondingCurve: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  compoundEthPCVDripController: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  daiBondingCurve: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  daiPCVDripController: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  daiPSM: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  ethReserveStabilizer: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  tribeReserveStabilizer: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveEthPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveFeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveRaiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  agEurAngleUniswapPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  compoundDaiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  compoundEthPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  creamFeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  d3poolConvexPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  d3poolCurvePCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  dpiUniswapPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  ethLidoPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  ethTokemakPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  feiLusdLBPSwapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  indexCoopFusePoolDpiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  indexCoopFusePoolFeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  indexDelegator: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  liquityFusePoolLusdPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  poolPartyFeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool18FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool19DpiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool19FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool22FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool24FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool25FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool26FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool27FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool28FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool31FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool54FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool6FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool72FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool79FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool7FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool7LusdPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool8FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool90FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool91FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool9FeiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool9RaiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  reflexerStableAssetFusePoolRaiPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  tokeTokemakPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  uniswapPCVDeposit: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveEthPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveFeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveRaiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  balDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  collateralizationOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  collateralizationOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  collateralizationOracleWrapperImpl: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  compoundDaiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  compoundEthPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  creamDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  creamFeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  daiBondingCurveWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  ethLidoPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  ethReserveStabilizerWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  feiBuybackLens: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  feiLusdLens: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  feiOATimelockWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool18FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool19DpiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool19FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool24FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool25FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool26FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool27FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool28FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool31FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool6FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool7FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool8FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool9FeiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariPool9RaiPCVDepositWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  staticPcvDepositWrapper2: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  balUsdCompositeOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkBALEthOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkCREAMEthOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkDaiUsdOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkDpiUsdOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkEthUsdOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkEurUsdOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkFeiEthOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkLUSDOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkRaiEthOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkRaiUsdCompositOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkTribeEthOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  chainlinkTribeEthOracleWrapper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  compositeOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  creamUsdCompositeOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  oneConstantOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  tribeUsdCompositeOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  zeroConstantOracle: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  collateralizationOracleKeeper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveTribeIncentivesController: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  aaveTribeIncentivesControllerImpl: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  autoRewardsDistributor: {
    contractDependencies: ['core', 'rewardsDistributorAdmin', 'tribalChiefSync'],
    externalDependencies: []
  },
  erc20Dripper: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  rariRewardsDistributorDelegate: {
    contractDependencies: [
      'rariRewardsDistributorDelegator' // proxy
    ],
    externalDependencies: []
  },
  rariRewardsDistributorDelegator: {
    contractDependencies: [
      'rariPool8Tribe',
      'rariRewardsDistributorDelegate', // impl
      'rewardsDistributorAdmin' //admin
    ],
    externalDependencies: []
  },
  rewardsDistributorAdmin: {
    contractDependencies: [
      'rariRewardsDistributorDelegator',
      'optimisticTimelock',
      'autoRewardsDistributor' // rewards dripper role
    ],
    externalDependencies: []
  },
  stakingTokenWrapperFOXLaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperGROLaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperKYLINLaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperMStableLaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperNEARLaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperPoolTogetherLaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperRari: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperSYNLaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  stakingTokenWrapperUMALaaS: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  tribalChief: {
    contractDependencies: ['core', 'autoRewardsDistributor'],
    externalDependencies: []
  },
  tribalChiefImpl: {
    contractDependencies: ['core'],
    externalDependencies: []
  },
  tribalChiefSync: {
    contractDependencies: [
      'autoRewardsDistributor', // triggers autoRewardsDistributor after updates
      'optimisticTimelock', // executes atomic updates
      'tribalChief' // mass updates pools
    ],
    externalDependencies: []
  },
  rariPool8Comptroller: {
    contractDependencies: [
      'rariPool8Dai',
      'rariPool8Eth',
      'rariPool8Fei',
      'rariPool8Tribe',
      'rariRewardsDistributorDelegator', // registered rewards distributor
      'optimisticTimelock' // admin
    ],
    externalDependencies: []
  },
  rariPool8Dai: {
    contractDependencies: ['rariPool8Comptroller', 'rariPool8DaiIrm'],
    externalDependencies: []
  },
  rariPool8DaiIrm: {
    contractDependencies: ['rariPool8Dai'],
    externalDependencies: []
  },
  rariPool8Eth: {
    contractDependencies: ['rariPool8Comptroller', 'rariPool8EthIrm'],
    externalDependencies: []
  },
  rariPool8EthIrm: {
    contractDependencies: ['rariPool8Eth'],
    externalDependencies: []
  },
  rariPool8Fei: {
    contractDependencies: ['fei', 'rariPool8Comptroller', 'rariPool8FeiIrm'],
    externalDependencies: []
  },
  rariPool8FeiIrm: {
    contractDependencies: ['rariPool8Fei'],
    externalDependencies: []
  },
  rariPool8Tribe: {
    contractDependencies: [
      'tribe',
      'rariPool8Comptroller',
      'rariPool8TribeIrm',
      'rariRewardsDistributorDelegator' // Drips TRIBE rewards
    ],
    externalDependencies: []
  },
  rariPool8TribeIrm: {
    contractDependencies: ['rariPool8Tribe'],
    externalDependencies: []
  }
};

export default dependencies;
