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
import { abi as timelockABI } from '../../artifacts/contracts/dao/timelock/OptimisticTimelock.sol/OptimisticTimelock.json';
import { Contract } from 'ethers';
const toBN = ethers.BigNumber.from;

// How this works:
// Deployment
// 1. DAO deploys an admin tier factory contract to deploy admin pods, specifically the Tribal Council
// 2. DAO uses factory contract to create a Tribal Council pod, with empty members initially
// 3. DAO deploys a protocol tier pod factory to deploy protocol pods
// 4. DAO uses protocol tier pod factory to deploy the first protocol pod

// Validation
// 1. Validate admins
// 2. Validate all pod members, proposers and executors
// 3. Validate correct roles set on contracts

const validateArraysEqual = (arrayA: string[], arrayB: string[]) => {
  arrayA.every((a) => expect(arrayB.map((b) => b.toLowerCase()).includes(a.toLowerCase())));
};

// Note: The Orca token is a slow rollout mechanism used by Orca. In order to successfully deploy pods
// you need to have first been minted Orca tokens. Here, for testing purposes locally, we mint
// the addresses that will create pods Orca tokens. TODO: Remove once have SHIP tokens on Mainnet
const mintOrcaToken = async (address: string) => {
  const inviteTokenAddress = '0x872EdeaD0c56930777A82978d4D7deAE3A2d1539';
  const priviledgedAddress = '0x2149A222feD42fefc3A120B3DdA34482190fC666';

  const inviteTokenABI = [
    'function mint(address account, uint256 amount) external',
    'function balanceOf(address account) external view returns (uint256)'
  ];
  // Mint Orca Ship tokens to deploy address, to allow to deploy contracts
  const priviledgedAddressSigner = await getImpersonatedSigner(priviledgedAddress);
  const inviteToken = new ethers.Contract(inviteTokenAddress, inviteTokenABI, priviledgedAddressSigner);
  await inviteToken.mint(address, 10);
};

const fipNumber = '82';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy public pod executor
  const podExecutorFactory = await ethers.getContractFactory('PodExecutor');
  const podExecutor = await podExecutorFactory.deploy();
  await podExecutor.deployTransaction.wait();
  logging && console.log('PodExecutor deployed to', podExecutor.address);

  // 2. Deploy tribalCouncilPodFactory. Set podAdmin to deploy address, so pods can be created
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');

  const podFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    podExecutor.address // Public pod executor
  );
  await podFactory.deployTransaction.wait();
  await mintOrcaToken(podFactory.address);
  logging && console.log('DAO pod factory deployed to:', podFactory.address);

  // 3. Create TribalCouncil and Protocol Tier pods
  const tribalCouncilPod = {
    members: tribeCouncilPodConfig.placeHolderMembers,
    threshold: tribeCouncilPodConfig.threshold,
    label: tribeCouncilPodConfig.label,
    ensString: tribeCouncilPodConfig.ensString,
    imageUrl: tribeCouncilPodConfig.imageUrl,
    admin: addresses.feiDAOTimelock
  };

  const protocolTierPod = {
    members: protocolPodConfig.placeHolderMembers,
    threshold: protocolPodConfig.threshold,
    label: protocolPodConfig.label,
    ensString: protocolPodConfig.ensString,
    imageUrl: protocolPodConfig.imageUrl,
    admin: addresses.feiDAOTimelock
  };

  const pods = [tribalCouncilPod, protocolTierPod];
  const podMinDelays = [tribeCouncilPodConfig.minDelay, protocolPodConfig.minDelay];
  await podFactory.burnerCreateChildOptimisticPods(pods, podMinDelays);

  const protocolPodId = await podFactory.latestPodId();
  const tribalCouncilPodId = protocolPodId.sub(toBN(1));

  logging && console.log('TribalCouncil pod Id: ', tribalCouncilPodId.toString());
  logging && console.log('Protocol tier pod Id: ', protocolPodId.toString());

  const councilTimelockAddress = await podFactory.getPodTimelock(tribalCouncilPodId);
  const protocolPodTimelockAddress = await podFactory.getPodTimelock(protocolPodId);

  logging && console.log('Tribal council timelock deployed to: ', councilTimelockAddress);
  logging && console.log('Protocol pod timelock deployed to: ', protocolPodTimelockAddress);

  // 4. Create contract artifacts for timelocks, so address is available to DAO script
  const mockSigner = await getImpersonatedSigner(deployAddress);
  const tribalCouncilTimelock = new ethers.Contract(councilTimelockAddress, timelockABI, mockSigner);
  const protocolPodTimelock = new ethers.Contract(protocolPodTimelockAddress, timelockABI, mockSigner);

  return {
    podExecutor,
    podFactory,
    tribalCouncilTimelock,
    protocolPodTimelock
  };
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate podFactory has podFactory deploy role
  const podFactory = contracts.podFactory;

  // 2. Validate that Tribal Council Safe, timelock and podAdmin are configured
  const tribalCouncilPodId = await podFactory.getPodId(addresses.tribalCouncilTimelock);
  const tribalCouncilSafeAddress = await podFactory.getPodSafe(tribalCouncilPodId);

  const councilPodAdmin = await podFactory.getPodAdmin(tribalCouncilPodId);
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
  const councilMembers = await podFactory.getPodMembers(tribalCouncilPodId);
  validateArraysEqual(councilMembers, tribeCouncilPodConfig.members);

  const numCouncilMembers = await podFactory.getNumMembers(tribalCouncilPodId);
  expect(numCouncilMembers).to.equal(tribeCouncilPodConfig.numMembers);

  const councilThreshold = await podFactory.getPodThreshold(tribalCouncilPodId);
  expect(councilThreshold).to.equal(tribeCouncilPodConfig.threshold);

  ////////////////////// PROTOCOL TIER POD ///////////////////////////////
  // 1. Validate that the protocolTierPod Safe, timelock and podAdmin are configured
  const protocolPodId = await podFactory.getPodId(addresses.protocolPodTimelock);
  const protocolSafeAddress = await podFactory.getPodSafe(protocolPodId);

  const protocolPodAdmin = await podFactory.getPodAdmin(protocolPodId);
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
  const numPodMembers = await podFactory.getNumMembers(protocolPodId);
  expect(numPodMembers).to.equal(protocolPodConfig.numMembers);

  const podThreshold = await podFactory.getPodThreshold(protocolPodId);
  expect(podThreshold).to.equal(protocolPodConfig.threshold);

  const podMembers = await podFactory.getPodMembers(protocolPodId);
  validateArraysEqual(podMembers, protocolPodConfig.members);

  await validateTribeRoles(
    contracts.core,
    addresses.feiDAOTimelock,
    addresses.tribalCouncilTimelock,
    addresses.protocolTimelock
  );
};

const validateTribeRoles = async (
  core: Contract,
  feiDAOTimelockAddress: string,
  tribalCouncilTimelockAddress: string,
  protocolPodTimelockAddress: string
) => {
  // feiDAOTimelock added roles: POD_DEPLOYER_ROLE
  const daoIsPodDeployer = await core.hasRole(ethers.utils.id('POD_DEPLOYER_ROLE'), feiDAOTimelockAddress);
  expect(daoIsPodDeployer).to.be.true;

  // TribalCouncilTimelock roles: ROLE_ADMIN, POD_DEPLOYER_ROLE, POD_VETO_ROLE
  const councilIsRoleAdmin = await core.hasRole(ethers.utils.id('ROLE_ADMIN'), tribalCouncilTimelockAddress);
  expect(councilIsRoleAdmin).to.be.true;

  const councilIsPodDeployer = await core.hasRole(ethers.utils.id('POD_DEPLOYER_ROLE'), tribalCouncilTimelockAddress);
  expect(councilIsPodDeployer).to.be.true;

  const councilIsPodVetoAdmin = await core.hasRole(ethers.utils.id('POD_VETO_ADMIN'), tribalCouncilTimelockAddress);
  expect(councilIsPodVetoAdmin).to.be.true;

  // Protocol pod timelock roles: Specific first pod duties role
  const protocolPodIsVotiumRole = await core.hasRole(ethers.utils.id('VOTIUM_ADMIN_ROLE'), protocolPodTimelockAddress);
  expect(protocolPodIsVotiumRole).to.be.true;
};

export { deploy, setup, teardown, validate };
