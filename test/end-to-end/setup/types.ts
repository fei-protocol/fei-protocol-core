export type TestEnv = {
  contracts: any[]
  addresses: any[]
}

export interface TestCoordinator {
  initialiseLocalEnv(): Promise<TestEnv>;
  initialiseMainnetEnv(): Promise<TestEnv>;
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