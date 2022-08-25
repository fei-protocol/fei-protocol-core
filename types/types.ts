import { ethers } from 'ethers';
import {
  AavePCVDeposit,
  AutoRewardsDistributor,
  BalancerLBPSwapper,
  CErc20Delegator,
  ChainlinkOracleWrapper,
  CollateralizationOracle,
  CollateralizationOracleKeeper,
  CollateralizationOracleWrapper,
  CompositeOracle,
  Core,
  ERC20CompoundPCVDeposit,
  ERC20Dripper,
  ERC20Splitter,
  EthCompoundPCVDeposit,
  Fei,
  FeiDAO,
  GovernanceMetadataRegistry,
  GovernorAlpha,
  IAaveIncentivesController,
  IERC20,
  IKashiPair,
  ILendingPool,
  IMasterContractManager,
  IUniswapV2Pair,
  OptimisticTimelock,
  PCVDripController,
  PCVEquityMinter,
  RewardsDistributorAdmin,
  StakingTokenWrapper,
  Timelock,
  TimelockController,
  TribalChief,
  Tribe,
  TribeReserveStabilizer,
  UniswapPCVDeposit
} from './contracts';
import { RestrictedPermissions } from './contracts/RestrictedPermissions';

export type ContractsAndAddresses = {
  contracts: NamedContracts;
  contractAddresses: NamedAddresses;
};

export interface TestCoordinator {
  loadEnvironment(): Promise<ContractsAndAddresses>;
}

export function namedContractsToNamedAddresses(contracts: NamedContracts): NamedAddresses {
  const namedAddresses: NamedAddresses = {};

  Object.keys(contracts).map(function (contractName) {
    namedAddresses[contractName] = contracts[contractName].address;
  });

  return namedAddresses;
}

export type Dependency = {
  contractDependencies: string[];
};
export type DependencyMap = { [key: string]: Dependency };

export enum ProposalCategory {
  DAO,
  DEBUG,
  TC, // Tribal Council
  DEBUG_TC,
  None
}

export interface ProposalConfig {
  deploy: boolean;
  category: ProposalCategory;
  totalValue: number;
  proposal: ProposalDescription;
  affectedContractSignoff: string[];
  deprecatedContractSignoff: string[];
  proposalId: string;
}

export interface TemplatedProposalConfig {
  deploy: boolean;
  category: ProposalCategory;
  totalValue: number;
  proposal: TemplatedProposalDescription | undefined;
  affectedContractSignoff: string[];
  deprecatedContractSignoff: string[];
  proposalId: string;
}

export interface ProposalsConfigMap {
  [key: string]: ProposalConfig;
}

export interface TemplatedProposalsConfigMap {
  [key: string]: TemplatedProposalConfig;
}

export interface ProposalDescription {
  title: string;
  commands: ProposalCommand[];
  description: string;
}

export interface TemplatedProposalDescription {
  title: string;
  commands: TemplatedProposalCommand[];
  description: string;
}

export interface ProposalCommand {
  target: string;
  values: string;
  method: string;
  arguments: any[];
  description: string;
}

export interface TemplatedProposalCommand {
  target: string;
  values: string;
  method: string;
  arguments: (namedAddresses: NamedAddresses) => any[];
  description: string;
}

export type TribalChiefPoolConfig = {
  allocPoint: number;
  unlocked: boolean;
};

export interface PcvStats {
  protocolControlledValue: ethers.BigNumber;
  userCirculatingFei: ethers.BigNumber;
  protocolEquity: ethers.BigNumber;
}

export interface TribalChiefConfig {
  [key: string]: TribalChiefPoolConfig;
}

export interface ContractConfig {
  artifactName: string;
  address: string;
  category: AddressCategory;
}

export enum AddressCategory {
  Core = 'Core',
  Governance = 'Governance',
  Utility = 'Utility',
  Security = 'Security',
  Peg = 'Peg',
  PCV = 'PCV',
  PCV_V1 = 'PCV_V1',
  Collateralization = 'Collateralization',
  Oracle = 'Oracle',
  Rewards = 'Rewards',
  FeiRari = 'FeiRari',
  Turbo = 'Turbo',
  External = 'External',
  Deprecated = 'Deprecated',
  Fuse = 'Fuse',
  Volt = 'Volt',
  TBD = 'TBD',
  Distribution = 'Distribution'
}

export type NamedContracts = { [key: string]: ethers.Contract };
export type NamedAddresses = { [key: string]: string };
export type DeployUpgradeFunc = (
  deployAddress: string,
  address: NamedAddresses,
  logging: boolean
) => Promise<NamedContracts>;
export type SetupUpgradeFunc = (
  addresses: NamedAddresses,
  oldContracts: NamedContracts,
  contracts: NamedContracts,
  logging: boolean
) => Promise<void>;
export type RunUpgradeFunc = (
  addresses: NamedAddresses,
  oldContracts: NamedContracts,
  contracts: NamedContracts,
  logging: boolean
) => Promise<void>;
export type TeardownUpgradeFunc = (
  addresses: NamedAddresses,
  oldContracts: NamedContracts,
  contracts: NamedContracts,
  logging: boolean
) => Promise<void>;
export type ValidateUpgradeFunc = (
  addresses: NamedAddresses,
  oldContracts: NamedContracts,
  contracts: NamedContracts,
  logging: boolean
) => Promise<void>;

export type UpgradeFuncs = {
  deploy: DeployUpgradeFunc;
  setup: SetupUpgradeFunc;
  run: RunUpgradeFunc;
  teardown: TeardownUpgradeFunc;
  validate: ValidateUpgradeFunc;
};

export type Config = {
  version: number;
  deployAddress: string;
  logging: boolean;
};

export interface MainnetContracts {
  core: Core;
  tribe: Tribe;
  fei: Fei;
  uniswapPCVDeposit: UniswapPCVDeposit;
  uniswapPCVController: ethers.Contract;
  chainlinkEthUsdOracle: ChainlinkOracleWrapper;
  chainlinkFeiEthOracle: ChainlinkOracleWrapper;
  compositeOracle: CompositeOracle;
  tribeReserveStabilizer: TribeReserveStabilizer;
  timelock: Timelock;
  feiEthPair: IUniswapV2Pair;
  rariPool8FeiPCVDeposit: ERC20CompoundPCVDeposit;
  rariPool8EthPCVDeposit: EthCompoundPCVDeposit;
  compoundEthPCVDeposit: EthCompoundPCVDeposit;
  compoundDaiPCVDeposit: ERC20CompoundPCVDeposit;
  curveMetapoolDeposit: ethers.Contract;
  curve3pool: ethers.Contract;
  curve3crv: ethers.Contract;
  aaveEthPCVDeposit: AavePCVDeposit;
  aaveRaiPCVDeposit: AavePCVDeposit;
  stAAVE: IERC20;
  dpi: IERC20;
  dai: IERC20;
  chainlinkDpiUsdOracleWrapper: ChainlinkOracleWrapper;
  dpiUniswapPCVDeposit: UniswapPCVDeposit;
  rariPool19DpiPCVDeposit: ERC20CompoundPCVDeposit;
  rai: IERC20;
  chainlinkRaiEthOracleWrapper: ChainlinkOracleWrapper;
  chainlinkRaiUsdCompositeOracle: CompositeOracle;
  rariPool9RaiPCVDeposit: ERC20CompoundPCVDeposit;
  kashiFeiTribe: IKashiPair;
  bentoBox: IMasterContractManager;
  aaveEthPCVDripController: PCVDripController;
  governorAlpha: GovernorAlpha;
  tribalChief: TribalChief;
  stakingTokenWrapper: StakingTokenWrapper;
  feiTribePair: IUniswapV2Pair;
  rariPool8Tribe: CErc20Delegator;
  curveFei3crvMetapool: IERC20;
  erc20Dripper: ERC20Dripper;
  tribalChiefOptimisticTimelock: OptimisticTimelock;
  collateralizationOracle: CollateralizationOracle;
  collateralizationOracleWrapper: CollateralizationOracleWrapper;
  collateralizationOracleKeeper: CollateralizationOracleKeeper;
  tribeReserveStabilizerAddress: TribeReserveStabilizer;
  pcvEquityMinter: PCVEquityMinter;
  tribeSplitter: ERC20Splitter;
  feiTribeLBPSwapper: BalancerLBPSwapper;
  aaveLendingPool: ILendingPool;
  aaveTribeIncentivesController: IAaveIncentivesController;
  optimisticTimelock: OptimisticTimelock;
  feiDAO: FeiDAO;
  autoRewardsDistributor: AutoRewardsDistributor;
  rewardsDistributorAdmin: RewardsDistributorAdmin;
  restrictedPermissions: RestrictedPermissions;
  tribalCouncilTimelock: TimelockController;
  governanceMetadataRegistry: GovernanceMetadataRegistry;
}

export interface MainnetContractAddresses {
  core: string;
  tribe: string;
  fei: string;
  uniswapPCVDeposit: string;
  bondingCurve: string;
  chainlinkEthUsdOracle: string;
  chainlinkFeiEthOracle: string;
  compositeOracle: string;
  compoundDai: string;
  ethReserveStabilizer: string;
  ratioPCVController: string;
  weth: string;
  uniswapRouter: string;
  feiEthPair: string;
  uniswapOracle: string;
  feiRewardsDistributor: string;
  tribeReserveStabilizer: string;
  timelock: string;
  guardianMultisig: string;
  governorAlpha: string;
  rariPool19Dpi: string;
  rariPool9Rai: string;
  bentoBox: string;
  masterKashi: string;
  feiTribePair: string;
  rariPool8Tribe: string;
  curveFei3crvMetapool: string;
  optimisticMultisig: string;
  stakingTokenWrapperRari: string;
  rariRewardsDistributorDelegator: string;
  restrictedPermissions: string;
  tribalCouncilTimelock: string;
  governanceMetadataRegistry: string;
}

export type ContractAccessRights = {
  minter: string[];
  burner: string[];
  governor: string[];
  pcvController: string[];
  guardian: string[];
};
