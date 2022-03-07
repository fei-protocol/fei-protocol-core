import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { assert } from 'console';

const ZERO_ADDRESS = ethers.constants.AddressZero;

// How this will work:
// 1. DAO deploys a factory contract
// 2. DAO uses factory contract to deploy a Tribal Council
// 3. DAO adds members to the Tribal Council
// 4. Tribal Council deploys a factory contract
// 5. Factory contract used to deploy several product specific pods
// 6. Relevant authority gives each pod the necessary role
// Think through what happens if the controller is updated or changed somehow

const fipNumber = 'fip_82'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy public pod executor
  const podExecutorFactory = await ethers.getContractFactory('PodExecutor');
  const podExecutor = await podExecutorFactory.deploy();
  await podExecutor.deployTransaction.wait();
  logging && console.log('PodExecutor deployed to', podExecutor.address);

  // 2. Deploy tribalCouncilPodFactory
  const podFactoryEthersFactory = await ethers.getContractFactory('PodFactory');
  const tribalCouncilPodFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    addresses.feiDAOTimelock, // podAdmin - adds members etc. FEI DAO timelock
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    podExecutor.address // Public pod executor
  );
  await tribalCouncilPodFactory.deployTransaction.wait();

  logging && console.log('DAO pod factory deployed to:', tribalCouncilPodFactory.address);

  // 3. Deploy tribalCouncilPodFactory
  const protocolTierPodFactory = await podFactoryEthersFactory.deploy(
    addresses.core, // core
    ZERO_ADDRESS, // Set podAdmin to be zero address. Will later be set to Tribal council pod timelock
    addresses.podController, // podController
    addresses.memberToken, // podMembershipToken
    podExecutor.address // Public pod executor
  );
  await protocolTierPodFactory.deployTransaction.wait();

  return {
    podExecutor,
    tribalCouncilPodFactory,
    protocolTierPodFactory
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // This runs after DAO script

  // 1. Validate admin of daoPodFactory is the DAO timelock
  const daoPodFactory = contracts.daoPodFactory;
  const daoPodFactoryAdmin = await daoPodFactory.podAdmin();
  expect(daoPodFactoryAdmin).to.equal(addresses.feiDAOTimelock);

  // 2. Validate admin of tribalCouncilPodFactory is the TribalCouncil pod timelock
  const tribalCouncilPodFactory = contracts.tribalCouncilPodFactory;
  const tribalCouncilPodFactoryAdmin = await tribalCouncilPodFactory.podAdmin();
  expect(tribalCouncilPodFactoryAdmin).to.equal(addresses.tribalCouncilTimelock);

  // 3. Validate that Tribal Council pod has been correctly deployed
  const tribalCouncilPodId = 0; // TODO: How to make this robust?
  const tribalCouncilTimelockAddress = await tribalCouncilPodFactory.getPodTimelock(tribalCouncilPodId);
  const tribalCouncilSafeAddress = await tribalCouncilPodFactory.getPodSafe(tribalCouncilPodId);
  const tribalCouncilTimelock = await ethers.getContractAt('OptimisticTimelock', tribalCouncilTimelockAddress);

  const gnosisSafeIsProposer = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('PROPOSER_ROLE'),
    tribalCouncilSafeAddress
  );
  expect(gnosisSafeIsProposer).to.be.true;

  const publicExecutorIsExecutor = await tribalCouncilTimelock.hasRole(
    ethers.utils.id('EXECUTOR_ROLE'),
    addresses.podExecutor
  );
  expect(publicExecutorIsExecutor).to.be.true;

  const numCouncilMembers = await tribalCouncilPodFactory.getNumMembers(tribalCouncilPodId);
  expect(numCouncilMembers).to.equal(9);

  const councilThreshold = await tribalCouncilPodFactory.getThreshold(tribalCouncilPodId);
  expect(councilThreshold).to.equal(5);

  // Validate that tribal council has the correct roles, if any

  // 4. Validate that protocol specific pods have been correctly deployed
  // const fusePod = contracts.fusePod;

  // TODO: Check timelock proposer and executor
  // TODO: Check has expected roles
};

export { deploy, setup, teardown, validate };
