import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import { tribeCouncilPodConfig, protocolPodConfig } from '@protocol/optimisticGovernance';

// How this will work:
// Deployment
// 1. DAO deploys an admin tier factory contract to deploy admin pods, specifically the Tribal Council
// 2. DAO uses factory contract to create a Tribal Council pod, with empty members initially
// 3. DAO deploys a protocol tier pod factory to deploy protocol pods
// 4. DAO uses protocol tier pod factory to deploy the first protocol pod

// DAO actions
// 1. Set the Tribal Council members
// 2. Set the correct admin on the Tribal Council factory
// 3. Set the correct admin on the Protocol Pod Factory
// 4. Grant the TribalCouncil timelock the ROLE_ADMIN
// 5. Grant the Protocol Pod timelock the ORACLE_ADMIN role

// Validation
// 1. Validate admins
// 2. Validate all pod members, proposers and executors
// 3. Validate correct roles set on contracts

// How to pass the contract addresses through to the DAO script?

const fipNumber = '82'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const tempPodAdmin = deployAddress;

  // 1. Deploy public pod executor
  const podExecutorFactory = await ethers.getContractFactory('PodExecutor');
  const podExecutor = await podExecutorFactory.deploy();
  await podExecutor.deployTransaction.wait();
  console.log('PodExecutor deployed to', podExecutor.address);

  // 2. Deploy tribalCouncilPodFactory. Set podAdmin to deploy address, so pods can be created
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');
  const tribalCouncilPodFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    tempPodAdmin, // tempPodAdmin. Later changed to FEI DAO timelock
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    podExecutor.address // Public pod executor
  );
  await tribalCouncilPodFactory.deployTransaction.wait();
  console.log('DAO pod factory deployed to:', tribalCouncilPodFactory.address);

  // 3. Create TribalCouncil pod - what part of this needs to go on-chain?
  // Maybe create empty pods first, then rely on the DAO vote to populate with real members?
  const nextPodId = await tribalCouncilPodFactory.getNextPod();
  console.log({ nextPodId });
  const [tribalCouncilPodId, councilTimelockAddress] = await tribalCouncilPodFactory.createChildOptimisticPod(
    tribeCouncilPodConfig.members,
    tribeCouncilPodConfig.threshold,
    tribeCouncilPodConfig.podLabel,
    tribeCouncilPodConfig.ensString,
    tribeCouncilPodConfig.imageUrl,
    tribeCouncilPodConfig.minDelay
  );
  console.log('TribalCouncil pod Id: ', tribalCouncilPodId);
  console.log('Tribal council timelock deployed to: ', councilTimelockAddress);

  // 4. Deploy protocolTierPodFactory. Set podAdmin to deploy address, to pods can be created
  const protocolTierPodFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    tempPodAdmin, // tempPodAdmin. Later changed to TribalCouncil pod timelock
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    addresses.podExecutor // Public pod executor
  );
  await protocolTierPodFactory.deployTransaction.wait();
  console.log('Protocol tier pod factory deployed to:', protocolTierPodFactory.address);

  // 5. Create protocol tier pod
  const [protocolPodId, protocolPodTimelockAddress] = await protocolTierPodFactory.createChildOptimisticPod(
    tribeCouncilPodConfig.members,
    tribeCouncilPodConfig.threshold,
    tribeCouncilPodConfig.podLabel,
    tribeCouncilPodConfig.ensString,
    tribeCouncilPodConfig.imageUrl,
    tribeCouncilPodConfig.minDelay
  );
  console.log('Protocol pod Id: ', protocolPodId);
  console.log('Protocol pod timelock deployed to: ', protocolPodTimelockAddress);

  // 6. Transfer ownership of PodFactories to the relevant timelocks
  await tribalCouncilPodFactory.transferOwnership(councilTimelockAddress);
  await protocolTierPodFactory.transferOwnership(protocolPodTimelockAddress);

  // 7. Create contract artifacts for timelocks, so address is available to DAO script
  const timelockABI = [
    'function execute(address target,uint256 value,bytes calldata data,bytes32 predecessor,bytes32 salt)',
    'function cancel(bytes32 id)',
    'function schedule(address target,uint256 value,bytes calldata data,bytes32 predecessor,bytes32 salt,uint256 delay)',
    'function hasRole(bytes32 role, address account) returns(bool)'
  ];
  const mockSigner = await getImpersonatedSigner(deployAddress);
  const tribalCouncilTimelock = new ethers.Contract(councilTimelockAddress, timelockABI, mockSigner);
  const protocolPodTimelock = new ethers.Contract(protocolPodTimelockAddress, timelockABI, mockSigner);

  return {
    podExecutor,
    tribalCouncilPodFactory,
    protocolTierPodFactory,
    tribalCouncilTimelock,
    protocolPodTimelock
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // TODO: Remove once have SHIP tokens on Mainnet
  const inviteTokenAddress = '0x872EdeaD0c56930777A82978d4D7deAE3A2d1539';
  const priviledgedAddress = '0x2149A222feD42fefc3A120B3DdA34482190fC666';

  const inviteTokenABI = [
    'function mint(address account, uint256 amount) external',
    'function balanceOf(address account) external view returns (uint256)'
  ];
  // Mint Orca Ship tokens to deploy address, to allow to deploy contracts
  const priviledgedAddressSigner = await getImpersonatedSigner(priviledgedAddress);
  const inviteToken = new ethers.Contract(inviteTokenAddress, inviteTokenABI, priviledgedAddressSigner);

  // Want access to deploy address, mint it SHIP
  await inviteToken.mint(addresses.feiDAOTimelock, 10);
  await inviteToken.mint(addresses.feiDAOTimelock, 10);
  await inviteToken.mint(contracts.tribalCouncilPodFactory.address, 10);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate admin of tribeCouncilPodFactory is the DAO timelock
  const tribalCouncilPodFactory = contracts.tribalCouncilPodFactory;
  const tribeCouncilFactoryAdmin = await tribalCouncilPodFactory.owner();
  expect(tribeCouncilFactoryAdmin).to.equal(addresses.feiDAOTimelock);
  // TODO: Validate podAdmin

  // 2. Validate that Tribal Council Safe and timelock configured
  const tribalCouncilPodId = await tribalCouncilPodFactory.getPodId(addresses.tribalCouncilTimelock);
  const tribalCouncilSafeAddress = await tribalCouncilPodFactory.getPodSafe(tribalCouncilPodId);

  const tribalCouncilTimelock = contracts.tribalCouncilTimelock;
  const councilSafeIsProposer = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('PROPOSER_ROLE'),
    tribalCouncilSafeAddress
  );
  expect(councilSafeIsProposer).to.be.true;

  const tribePublicExecutorIs = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('EXECUTOR_ROLE'),
    addresses.podExecutor
  );
  expect(tribePublicExecutorIs).to.be.true;

  // 3. Validate that Tribal Council members are correctly set
  const councilMembers = await tribalCouncilPodFactory.getPodMembers(tribalCouncilPodId);
  expect(councilMembers).to.deep.equal(tribeCouncilPodConfig.members);

  const numCouncilMembers = await tribalCouncilPodFactory.getNumMembers(tribalCouncilPodId);
  expect(numCouncilMembers).to.equal(tribeCouncilPodConfig.numMembers);

  const councilThreshold = await tribalCouncilPodFactory.getPodThreshold(tribalCouncilPodId);
  expect(councilThreshold).to.equal(tribeCouncilPodConfig.threshold);

  // 4. Validate that TribalCouncil timelock has ROLE_ADMIN role
  const core = contracts.core;
  const councilHasRole = await core.hasRole(ethers.utils.id('ROLE_ADMIN'), addresses.tribalCouncilTimelock);
  expect(councilHasRole).to.be.true;

  ////////////////////// PROTOCOL TIER POD ///////////////////////////////

  // 1. Validate admin of protocolTierPodFactory is the TribalCouncil pod timelock
  const protocolTierPodFactory = contracts.protocolTierPodFactory;
  const protocolTierFactoryAdmin = await protocolTierPodFactory.owner();
  expect(protocolTierFactoryAdmin).to.equal(addresses.tribalCouncilTimelock);

  // 2. Validate that the protocolTierPod Safe and timelock are configured
  const protocolPodId = await protocolTierPodFactory.getPodId(addresses.protocolPodTimelock);
  const protocolSafeAddress = await protocolTierPodFactory.getPodSafe(protocolPodId);
  const protocolTimelock = await ethers.getContractAt('OptimisticTimelock', addresses.protocolPodTimelock);

  const podSafeIsProposer = await protocolTimelock.hasRole(ethers.utils.id('PROPOSER_ROLE'), protocolSafeAddress);
  expect(podSafeIsProposer).to.be.true;

  const podExecutorIsExecutor = await protocolTimelock.hasRole(ethers.utils.id('EXECUTOR_ROLE'), addresses.podExecutor);
  expect(podExecutorIsExecutor).to.be.true;

  // 3. Validate that protocol tier pod members Council members are correctly set
  const numPodMembers = await protocolTierPodFactory.getNumMembers(protocolPodId);
  expect(numPodMembers).to.equal(protocolPodConfig.numMembers);

  const podThreshold = await protocolTierPodFactory.getPodThreshold(protocolPodId);
  expect(podThreshold).to.equal(protocolPodConfig.threshold);

  const podMembers = await protocolTierPodFactory.getPodMembers(protocolPodId);
  expect(podMembers).to.deep.equal(protocolPodConfig.members);

  // 4. Validate that protocol pod tier has role ORACLE_ADMIN
  const protocolPodHasRole = await core.hasRole(ethers.utils.id('ORACLE_ADMIN'), addresses.protocolPodTimelock);
  expect(protocolPodHasRole).to.be.true;
};

export { deploy, setup, teardown, validate };
