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

// How this works:
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

const mintOrcaToken = async (address: string) => {
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
  await inviteToken.mint(address, 10);
};

const validateArraysEqual = async (arrayA: string[], arrayB: string[]) => {
  expect(arrayA.length).to.equal(arrayB.length);
  const lowerCaseA = arrayA.map((a) => a.toLowerCase());
  const lowerCaseB = arrayB.map((b) => b.toLowerCase());

  for (let i = 0; i < lowerCaseA.length; i++) {
    expect(lowerCaseA.includes(lowerCaseB[i])).to.be.true;
  }
};

const fipNumber = '82';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy public pod executor
  const podExecutorFactory = await ethers.getContractFactory('PodExecutor');
  const podExecutor = await podExecutorFactory.deploy();
  await podExecutor.deployTransaction.wait();
  console.log('PodExecutor deployed to', podExecutor.address);

  // 2. Deploy tribalCouncilPodFactory. Set podAdmin to deploy address, so pods can be created
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');

  const tribalCouncilPodFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    podExecutor.address // Public pod executor
  );
  await tribalCouncilPodFactory.deployTransaction.wait();
  await mintOrcaToken(tribalCouncilPodFactory.address);
  console.log('DAO pod factory deployed to:', tribalCouncilPodFactory.address);

  // 3. Create TribalCouncil pod
  await tribalCouncilPodFactory.createChildOptimisticPod(
    tribeCouncilPodConfig.placeHolderMembers,
    tribeCouncilPodConfig.threshold,
    tribeCouncilPodConfig.podLabel,
    tribeCouncilPodConfig.ensString,
    tribeCouncilPodConfig.imageUrl,
    tribeCouncilPodConfig.minDelay,
    addresses.feiDAOTimelock // podAdmin
  );
  const tribalCouncilPodId = await tribalCouncilPodFactory.latestPodId();
  const councilTimelockAddress = await tribalCouncilPodFactory.getPodTimelock(tribalCouncilPodId);

  console.log('TribalCouncil pod Id: ', tribalCouncilPodId.toString());
  console.log('Tribal council timelock deployed to: ', councilTimelockAddress);

  // 4. Deploy protocolTierPodFactory. Set podAdmin to deploy address, to pods can be created
  const protocolTierPodFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    podExecutor.address // Public pod executor
  );
  await protocolTierPodFactory.deployTransaction.wait();
  await mintOrcaToken(protocolTierPodFactory.address);
  console.log('Protocol tier pod factory deployed to:', protocolTierPodFactory.address);

  // 5. Create protocol tier pod
  await protocolTierPodFactory.createChildOptimisticPod(
    protocolPodConfig.placeHolderMembers,
    protocolPodConfig.threshold,
    protocolPodConfig.podLabel,
    protocolPodConfig.ensString,
    protocolPodConfig.imageUrl,
    protocolPodConfig.minDelay,
    addresses.feiDAOTimelock // Temporarily set to FeiDAOTimelock for deployment. Later transferred to TribalCouncil pod timelock
  );
  const protocolPodId = await protocolTierPodFactory.latestPodId();
  console.log('Protocol tier pod Id: ', protocolPodId.toString());

  const protocolPodTimelockAddress = await protocolTierPodFactory.getPodTimelock(protocolPodId);
  console.log('Protocol pod timelock deployed to: ', protocolPodTimelockAddress);

  // 6. Transfer ownership of PodFactories to the relevant timelocks
  //    These owners are the addresses allowed to create new pods in the future
  //    They should be one level up
  await tribalCouncilPodFactory.transferOwnership(addresses.feiDAOTimelock);
  await protocolTierPodFactory.transferOwnership(councilTimelockAddress);

  // 7. Create contract artifacts for timelocks, so address is available to DAO script
  const timelockABI = [
    'function execute(address target,uint256 value,bytes calldata data,bytes32 predecessor,bytes32 salt)',
    'function cancel(bytes32 id)',
    'function schedule(address target,uint256 value,bytes calldata data,bytes32 predecessor,bytes32 salt,uint256 delay)',
    'function hasRole(bytes32 role, address account) view returns(bool)'
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

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate admin of tribeCouncilPodFactory is the DAO timelock
  const tribalCouncilPodFactory = contracts.tribalCouncilPodFactory;
  const tribeCouncilFactoryOwner = await tribalCouncilPodFactory.owner();
  expect(tribeCouncilFactoryOwner).to.equal(addresses.feiDAOTimelock);

  // 2. Validate that Tribal Council Safe, timelock and podAdmin are configured
  const tribalCouncilPodId = await tribalCouncilPodFactory.getPodId(addresses.tribalCouncilTimelock);
  const tribalCouncilSafeAddress = await tribalCouncilPodFactory.getPodSafe(tribalCouncilPodId);

  const councilPodAdmin = await tribalCouncilPodFactory.getPodAdmin(tribalCouncilPodId);
  expect(councilPodAdmin).to.equal(addresses.feiDAOTimelock);

  const tribalCouncilTimelock = contracts.tribalCouncilTimelock;
  const councilSafeIsProposer = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('PROPOSER_ROLE'),
    tribalCouncilSafeAddress
  );
  expect(councilSafeIsProposer).to.be.true;

  const podExecutorIsExecutor = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('EXECUTOR_ROLE'),
    addresses.podExecutor
  );
  expect(podExecutorIsExecutor).to.be.true;

  // 3. Validate that Tribal Council members are correctly set
  const councilMembers = await tribalCouncilPodFactory.getPodMembers(tribalCouncilPodId);
  validateArraysEqual(councilMembers, tribeCouncilPodConfig.members);

  const numCouncilMembers = await tribalCouncilPodFactory.getNumMembers(tribalCouncilPodId);
  expect(numCouncilMembers).to.equal(tribeCouncilPodConfig.numMembers);

  const councilThreshold = await tribalCouncilPodFactory.getPodThreshold(tribalCouncilPodId);
  expect(councilThreshold).to.equal(tribeCouncilPodConfig.threshold);

  // 4. Validate that TribalCouncil timelock has ROLE_ADMIN role
  const core = contracts.core;
  const councilHasRole = await core.hasRole(ethers.utils.id('ROLE_ADMIN'), addresses.tribalCouncilTimelock);
  expect(councilHasRole).to.be.true;

  ////////////////////// PROTOCOL TIER POD ///////////////////////////////

  // 1. Validate owner of protocolTierPodFactory is the TribalCouncil pod timelock
  const protocolTierPodFactory = contracts.protocolTierPodFactory;
  const protocolTierFactoryOwner = await protocolTierPodFactory.owner();
  expect(protocolTierFactoryOwner).to.equal(addresses.tribalCouncilTimelock);

  // 2. Validate that the protocolTierPod Safe, timelock and podAdmin are configured
  const protocolPodId = await protocolTierPodFactory.getPodId(addresses.protocolPodTimelock);
  const protocolSafeAddress = await protocolTierPodFactory.getPodSafe(protocolPodId);

  const protocolPodAdmin = await protocolTierPodFactory.getPodAdmin(protocolPodId);
  expect(protocolPodAdmin).to.equal(addresses.tribalCouncilTimelock);

  const protocolTimelock = contracts.protocolPodTimelock;
  const protocolSafeIsProposer = await protocolTimelock.hasRole(ethers.utils.id('PROPOSER_ROLE'), protocolSafeAddress);
  expect(protocolSafeIsProposer).to.be.true;

  const publicExecutorIsPodExecutor = await protocolTimelock.hasRole(
    ethers.utils.id('EXECUTOR_ROLE'),
    addresses.podExecutor
  );
  expect(publicExecutorIsPodExecutor).to.be.true;

  // 3. Validate that protocol tier pod members Council members are correctly set
  const numPodMembers = await protocolTierPodFactory.getNumMembers(protocolPodId);
  expect(numPodMembers).to.equal(protocolPodConfig.numMembers);

  const podThreshold = await protocolTierPodFactory.getPodThreshold(protocolPodId);
  expect(podThreshold).to.equal(protocolPodConfig.threshold);

  const podMembers = await protocolTierPodFactory.getPodMembers(protocolPodId);
  validateArraysEqual(podMembers, protocolPodConfig.members);

  // 4. Validate that protocol pod tier has role ORACLE_ADMIN
  const protocolPodHasRole = await core.hasRole(ethers.utils.id('ORACLE_ADMIN'), addresses.protocolPodTimelock);
  expect(protocolPodHasRole).to.be.true;
};

export { deploy, setup, teardown, validate };
