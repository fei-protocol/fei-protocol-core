const { web3 } = require('hardhat');
const { Contract } = web3.eth

export type TestEnv = {
  contracts: TestEnvContracts
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
  ethReserveStabilizer: typeof Contract,
  pcvDripController: typeof Contract,
  ratioPCVController: typeof Contract,
  tribeReserveStabilizer: typeof Contract,
}

export type ContractAddresses = {
  core: string,
  tribe: string,
  fei: string,
  uniswapPCVDeposit: string,
  uniswapPCVController: string,
  bondingCurve: string,
  chainlinkEthUsdOracleWrapper: string,
  chainlinkFeiEthOracleWrapper: string,
  compositeOracle: string
  ethReserveStabilizer: string,
  pcvDripController: string,
  ratioPCVController: string,
  tribeReserveStabilizer: string,
  weth: string,
  uniswapRouter: string,
  feiEthPair: string,
  uniswapOracle: string,
}