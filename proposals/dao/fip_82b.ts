import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';
import {
  protocolPodMembers,
  protocolPodThreshold,
  protocolPodNumMembers
} from '@protocol/optimisticGovernance/protocolPods';

// Steps:
// 1. Deploy factory contract for protocol tier pods
// 2. Grant ROLE_ADMIN to TribalCouncil timelock
// 3. Create optimistic governance pod
// 4. Grant relevant permissins to optimistic governance pod

const fipNumber = '82_b'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy protocolTierPodFactory
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');
  const protocolTierPodFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.tribalCouncil, // Set podAdmin to be zero address. Will later be set to Tribal council pod timelock
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    addresses.podExecutor // Public pod executor
  );
  await protocolTierPodFactory.deployTransaction.wait();
  console.log('Protocol tier pod factory deployed to:', protocolTierPodFactory.address);

  return {
    protocolTierPodFactory
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
  // 1. Validate that tribal council timelock has the ADMIN_ROLE
  const core = contracts.core;
  const tribalCouncilHasAdminRole = await core.hasRole(ethers.utils.id('ADMIN_ROLE'), addresses.tribalCouncilTimelock);
  expect(tribalCouncilHasAdminRole).to.be.true;

  // 2. Validate admin of protocolTierPodFactory is the TribalCouncil pod timelock
  const protocolTierPodFactory = contracts.protocolTierPodFactory;
  const protocolTierFactoryAdmin = await protocolTierPodFactory.podAdmin();
  expect(protocolTierFactoryAdmin).to.equal(addresses.tribalCouncilTimelock);

  // 3. Validate that the protocolTierPod Safe and timelock are configured
  const protocolPodId = await protocolTierPodFactory.latestPodId(); // TODO: How to make this robust?
  const protocolTimelockAddress = await protocolTierPodFactory.getPodTimelock(protocolPodId);
  const protocolSafeAddress = await protocolTierPodFactory.getPodSafe(protocolPodId);
  const protocolTimelock = await ethers.getContractAt('OptimisticTimelock', protocolTimelockAddress);

  const gnosisSafeIsProposer = await protocolTimelock.hasRole(ethers.utils.id('PROPOSER_ROLE'), protocolSafeAddress);
  expect(gnosisSafeIsProposer).to.be.true;

  const publicExecutorIsExecutor = await protocolTimelock.hasRole(
    ethers.utils.id('EXECUTOR_ROLE'),
    addresses.podExecutor
  );
  expect(publicExecutorIsExecutor).to.be.true;

  // 3. Validate that Tribal Council members are correctly set
  const numPodMembers = await protocolTierPodFactory.getNumMembers(protocolPodId);
  expect(numPodMembers).to.equal(protocolPodThreshold);

  const podThreshold = await protocolTierPodFactory.getPodThreshold(protocolPodId);
  expect(podThreshold).to.equal(protocolPodNumMembers);

  const podMembers = await protocolTierPodFactory.getPodMembers(protocolPodId);
  expect(podMembers).to.deep.equal(protocolPodMembers);

  // 4. Validate that protocol pod has correct role
};

export { deploy, setup, teardown, validate };
