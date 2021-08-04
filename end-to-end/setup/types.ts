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
  kashiFeiTribe: typeof Contract,
  bentoBox: typeof Contract,
  governorAlpha: typeof Contract,
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
  bentoBoxAddress: string,
  masterKashiAddress: string,
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