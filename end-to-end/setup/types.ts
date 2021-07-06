const { web3 } = require('hardhat');
const { Contract } = web3.eth

export type EnvAfterUpgrade = {
  contracts: ContractsAfterUpgrade,
  contractAddresses: AddressesAfterUpgrade,
}

export type EnvBeforeUpgrade = {
  contracts: ContractsBeforeUpgrade,
  contractAddresses: AddressesBeforeUpgrade,
}

export interface TestCoordinator {
  applyUpgrade(): Promise<EnvAfterUpgrade>;
  beforeUpgrade(): Promise<EnvBeforeUpgrade>;
}

export type Config = {
  version: number;
  deployAddress: string;
  logging: boolean;
}

export type ExistingProtocolContracts = {
  core: typeof Contract,
  tribe: typeof Contract,
  fei: typeof Contract,
  ethReserveStabilizer: typeof Contract,
  feiRewardsDistributor: typeof Contract,
  timelock: typeof Contract,
  feiEthPair: typeof Contract,
}

export type ContractsBeforeUpgrade = {
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
  feiRewardsDistributor: typeof Contract,
  timelock: typeof Contract,
  feiEthPair: typeof Contract,
}

export type ContractsAfterUpgrade = {
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
  pcvDripController: typeof Contract,
  feiRewardsDistributor: typeof Contract,
  timelock: typeof Contract,
  feiEthPair: typeof Contract,
}

export type AddressesBeforeUpgrade = {
  core: string,
  tribe: string,
  fei: string,
  uniswapPCVDeposit: string,
  uniswapPCVController: string,
  bondingCurve: string,
  chainlinkEthUsdOracle: string,
  chainlinkFeiEthOracle: string,
  compositeOracle: string,
  ethReserveStabilizer: string,
  ratioPCVController: string,
  feiRewardsDistributor: string,
  timelock: string,
  feiEthPair: string,
  multisig: string
}

export type AddressesAfterUpgrade = {
  core: string,
  tribe: string,
  fei: string,
  uniswapPCVDeposit: string,
  uniswapPCVController: string,
  bondingCurve: string,
  chainlinkEthUsdOracle: string,
  chainlinkFeiEthOracle: string,
  compositeOracle: string,
  ethReserveStabilizer: string,
  ratioPCVController: string,
  feiRewardsDistributor: string,
  tribeReserveStabilizer: string,
  pcvDripController: string,
  timelock: string,
  feiEthPair: string,
  multisig: string
}

export type MainnetContractAddresses = {
  core: string,
  tribe: string,
  fei: string,
  uniswapPCVDeposit: string,
  uniswapPCVController: string,
  bondingCurve: string,
  chainlinkEthUsdOracle: string,
  chainlinkFeiEthOracle: string,
  compositeOracle: string
  ethReserveStabilizer: string,
  ratioPCVController: string,
  weth: string,
  uniswapRouter: string,
  feiEthPair: string,
  uniswapOracle: string,
  feiRewardsDistributor: string,
  timelock: string,
  multisig: string,
}

export type ContractAccessRights = 
  {
    minter: string[],
    burner: string[],
    governor: string[],
    pcvController: string[],
    guardian: string[],
  }