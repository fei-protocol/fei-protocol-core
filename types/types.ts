import { Contract, ethers } from 'ethers';
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
  TribalChief,
  Tribe,
  TribeReserveStabilizer,
  UniswapPCVDeposit
} from './contracts';
import { RestrictedPermissions } from './contracts/RestrictedPermissions';

export type Env = {
  contracts: NamedContracts;
  contractAddresses: NamedAddresses;
};

export interface TestCoordinator {
  loadEnvironment(): Promise<Env>;
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
  OA,
  None
}

export type ProposalConfig = {
  deploy: boolean;
  category: ProposalCategory;
  totalValue: number;
  proposal: ProposalDescription;
  affectedContractSignoff: string[];
  deprecatedContractSignoff: string[];
  proposalId: string;
};

export type ProposalsConfigMap = {
  [key: string]: ProposalConfig;
};

export type ProposalDescription = {
  title: string;
  commands: ProposalCommand[];
  description: string;
};

export type ProposalCommand = {
  target: string;
  values: string;
  method: string;
  arguments: any[];
  description: string;
};

export interface MainnetAddresses {
  [key: string]: AddressConfig;
}

export interface AddressConfig {
  artifactName: string;
  address: string;
  category: AddressCategory;
}

export enum AddressCategory {
  Core = 'Core',
  Governance = 'Governance',
  Peg = 'Peg',
  PCV = 'PCV',
  PCV_V1 = 'PCV_V1',
  Collateralization = 'Collateralization',
  Oracle = 'Oracle',
  Keeper = 'Keeper',
  Rewards = 'Rewards',
  FeiRari = 'FeiRari',
  External = 'External',
  Deprecated = 'Deprecated',
  TBD = 'TBD'
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
  curveMetapool: ethers.Contract;
  curve3pool: ethers.Contract;
  curve3crv: ethers.Contract;
  aaveEthPCVDeposit: AavePCVDeposit;
  aaveRaiPCVDeposit: AavePCVDeposit;
  stAAVE: IERC20;
  dpi: IERC20;
  dai: IERC20;
  chainlinkDpiUsdOracleWrapper: ChainlinkOracleWrapper;
  dpiUniswapPCVDeposit: UniswapPCVDeposit;
  indexCoopFusePoolDpiPCVDeposit: ERC20CompoundPCVDeposit;
  rai: IERC20;
  chainlinkRaiEthOracleWrapper: ChainlinkOracleWrapper;
  chainlinkRaiUsdCompositeOracle: CompositeOracle;
  reflexerStableAssetFusePoolRaiPCVDeposit: ERC20CompoundPCVDeposit;
  kashiFeiTribe: IKashiPair;
  bentoBox: IMasterContractManager;
  aaveEthPCVDripController: PCVDripController;
  governorAlpha: GovernorAlpha;
  tribalChief: TribalChief;
  stakingTokenWrapper: StakingTokenWrapper;
  feiTribePair: IUniswapV2Pair;
  rariPool8Tribe: CErc20Delegator;
  curve3Metapool: IERC20;
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
  multisig: string;
  governorAlpha: string;
  indexCoopFusePoolDpi: string;
  reflexerStableAssetFusePoolRai: string;
  bentoBox: string;
  masterKashi: string;
  feiTribePair: string;
  rariPool8Tribe: string;
  curve3Metapool: string;
  tribalChiefOptimisticMultisig: string;
  stakingTokenWrapperRari: string;
  rariRewardsDistributorDelegator: string;
  restrictedPermissions: string;
}

export type ContractAccessRights = {
  minter: string[];
  burner: string[];
  governor: string[];
  pcvController: string[];
  guardian: string[];
};
