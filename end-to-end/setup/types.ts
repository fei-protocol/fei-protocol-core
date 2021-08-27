const { web3 } = require('hardhat');
const { Contract } = web3.eth

export type Env = {
  contracts: MainnetContracts,
  contractAddresses: MainnetContractAddresses,
}

export interface TestCoordinator {
  loadEnvironment(): Promise<Env>;
}

export type Config = {
  version: number;
  deployAddress: string;
  logging: boolean;
}

export type MainnetContracts = {
  core: typeof Contract,
  tribe: typeof Contract,
  fei: typeof Contract,
  uniswapPCVDeposit: typeof Contract,
  uniswapPCVController: typeof Contract,
  bondingCurve: typeof Contract,
  chainlinkEthUsdOracle: typeof Contract,
  chainlinkFeiEthOracle: typeof Contract,
  compositeOracle: typeof Contract,
  ethReserveStabilizer: typeof Contract,
  ratioPCVController: typeof Contract,
  tribeReserveStabilizer: typeof Contract,
  feiRewardsDistributor: typeof Contract,
  timelock: typeof Contract,
  feiEthPair: typeof Contract,
  pcvDripController: typeof Contract,
  rariPool8FeiPCVDeposit: typeof Contract,
  rariPool8EthPCVDeposit: typeof Contract,
  compoundEthPCVDeposit: typeof Contract,
  compoundDaiPCVDeposit: typeof Contract,
  aaveEthPCVDeposit: typeof Contract,
  aaveRaiPCVDeposit: typeof Contract,
  stAAVE: typeof Contract,
  dpiBondingCurve: typeof Contract,
  daiBondingCurve: typeof Contract,
  dpi: typeof Contract,
  dai: typeof Contract,
  chainlinkDpiUsdOracleWrapper: typeof Contract,
  dpiUniswapPCVDeposit: typeof Contract,
  indexCoopFusePoolDpiPCVDeposit: typeof Contract,
  raiBondingCurve: typeof Contract,
  rai: typeof Contract,
  chainlinkRaiEthOracleWrapper: typeof Contract
  chainlinkRaiUsdCompositOracle: typeof Contract
  reflexerStableAssetFusePoolRaiPCVDeposit: typeof Contract,
  kashiFeiTribe: typeof Contract,
  bentoBox: typeof Contract,
  aaveEthPCVDripController: typeof Contract,
  governorAlpha: typeof Contract,
  tribalChief: typeof Contract,
  stakingTokenWrapper: typeof Contract,
  feiTribePair: typeof Contract,
  rariPool8Tribe: typeof Contract,
  curve3Metapool: typeof Contract,
  erc20Dripper: typeof Contract,
  tribalChiefOptimisticTimelock: typeof Contract,
}

export type MainnetContractAddresses = {
  coreAddress: string,
  tribeAddress: string,
  feiAddress: string,
  uniswapPCVDepositAddress: string,
  uniswapPCVControllerAddress: string,
  bondingCurveAddress: string,
  chainlinkEthUsdOracleAddress: string,
  chainlinkFeiEthOracleAddress: string,
  compositeOracleAddress: string
  compoundDaiAddress: string,
  ethReserveStabilizerAddress: string,
  ratioPCVControllerAddress: string,
  wethAddress: string,
  uniswapRouterAddress: string,
  feiEthPairAddress: string,
  uniswapOracleAddress: string,
  feiRewardsDistributorAddress: string,
  tribeReserveStabilizerAddress: string,
  pcvDripControllerAddress: string,
  timelockAddress: string,
  multisigAddress: string,
  governorAlphaAddress: string,
  indexCoopFusePoolDpiAddress: string,
  reflexerStableAssetFusePoolRaiAddress: string
  bentoBoxAddress: string,
  masterKashiAddress: string,
  feiTribePairAddress: string,
  rariPool8TribeAddress: string,
  curve3MetapoolAddress: string,
  tribalChiefOptimisticMultisigAddress: string,
}

export type ProposalConfig = {
  deploy: boolean,
  exec: boolean,
  proposerAddress: string,
  voterAddress: string,
  proposal_calldata: string,
  totalValue: number,
}

export type ContractAccessRights = 
  {
    minter: string[],
    burner: string[],
    governor: string[],
    pcvController: string[],
    guardian: string[],
  }