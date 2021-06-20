const { web3 } = require('hardhat');
const { Contract } = web3.eth

export type TestEnv = {
  contracts: TestEnvContracts
  addresses: any[]
}

export interface TestCoordinator {
  initialiseLocalEnv(): Promise<TestEnv>;
  initialiseMainnetEnv(): Promise<TestEnv>;
}

export type TestEnvContracts = {
  core: typeof Contract,
  tribe: typeof Contract,
  fei: typeof Contract,
  uniswapPCVDeposit: typeof Contract,
  uniswapPCVController: typeof Contract,
  bondingCurve: typeof Contract,
  chainlinkEthUsdOracleWrapper: typeof Contract,
  chainlinkFeiEthOracleWrapper: typeof Contract,
  compositeOracle: typeof Contract,
  ethReserveStabiliser: typeof Contract,
  pcvDripController: typeof Contract,
  ratioPCVController: typeof Contract,
  tribeReserveStabilizer: typeof Contract,
}

export type ContractAddresses = {
  Core: string,
  Tribe: string,
  GovernorAlpha: string,
  Timelock: string,
  Fei: string,
  UniswapIncentive: string,
  EthBondingCurve: string,
  EthUniswapPCVDeposit: string,
  EthUniswapPCVController: string,
  UniswapOracle: string,
  BondingCurveOracle: string,
  FeiRewardsDistributor: string,
  FeiStakingRewards: string,
  GenesisGroup: string,
  FeiRouter: string,
  EthReserveStabiliser: string,
  EthPCVDripper: string,
  RatioPCVController: string,
  EthPCVDepositAdapter: string,
  FEIETHUniV2Pair: string,
  FEITRIBEUniV2Pair: string
}