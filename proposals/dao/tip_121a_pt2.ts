import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

/*

Deprecate Optimistic Governance and Tribal Council

*/

// Lower bounds on the deprecated Rari vested TRIBE and FEI
const DEPRECATED_RARI_VESTED_TRIBE_LOWER = '471669647387113140537798';
const DEPRECATED_RARI_VESTED_FEI_LOWER = '471669393708777270421106';

// Timelock roles
const TC_PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
const TC_CANCELLER_ROLE = ethers.utils.id('CANCELLER_ROLE');
const TC_EXECUTOR_ROLE = ethers.utils.id('EXECUTOR_ROLE');
const TC_TIMELOCK_ADMIN_ROLE = ethers.utils.id('TIMELOCK_ADMIN_ROLE');

let initialCoreTribeBalance: BigNumber;
let initialDAOFeiBalance: BigNumber;

const fipNumber = 'tip_121c_pt1';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  initialCoreTribeBalance = await contracts.tribe.balanceOf(addresses.core);
  initialDAOFeiBalance = await contracts.fei.balanceOf(addresses.feiDAOTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Verify Core Treasury received deprecated Rari vested TRIBE
  const coreTribeBalanceDiff = (await contracts.tribe.balanceOf(addresses.core)).sub(initialCoreTribeBalance);
  expect(coreTribeBalanceDiff).to.be.bignumber.greaterThan(toBN(DEPRECATED_RARI_VESTED_TRIBE_LOWER));

  // 2. Verify DAO timelock received Rari vested FEI
  expect(
    (await contracts.fei.balanceOf(addresses.feiDAOTimelock)).sub(initialDAOFeiBalance)
  ).to.be.bignumber.greaterThan(toBN(DEPRECATED_RARI_VESTED_FEI_LOWER));

  // 3. No verification of Tribe Roles revocations - there is a seperate e2e permissions test that does that

  // 4. Verify that timelock roles have been revoked
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_PROPOSER_ROLE, addresses.tribalCouncilSafe)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_EXECUTOR_ROLE, addresses.tribalCouncilSafe)).to.be.false;
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_EXECUTOR_ROLE, addresses.podExecutorV2)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_CANCELLER_ROLE, addresses.tribalCouncilSafe)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_TIMELOCK_ADMIN_ROLE, addresses.tribalCouncilTimelock)).to.be
    .false;

  // 5. Verify that deprecated Rari FEI/TRIBE vesting timelock pending admins set to DAO timelock
  expect(await contracts.rariInfraFeiTimelock.pendingBeneficiary()).to.equal(addresses.feiDAOTimelock);
  expect(await contracts.rariInfraTribeTimelock.pendingBeneficiary()).to.equal(addresses.feiDAOTimelock);

  // 6. Verify podAdminGateway still has cancellor role, so NopeDAO can veto
  expect(await contracts.tribalCouncilTimelock.hasRole(ethers.utils.id('CANCELLER_ROLE'), addresses.podAdminGateway)).to
    .be.true;
  expect(
    await contracts.tribalCouncilTimelock.hasRole(ethers.utils.id('TIMELOCK_ADMIN_ROLE'), addresses.feiDAOTimelock)
  ).to.be.true;

  // 7. Verify that DAO timelock can grant Tribal Council timelock internal roles to addresses
  const daoTimelockSigner = await getImpersonatedSigner(addresses.feiDAOTimelock);
  await contracts.tribalCouncilTimelock
    .connect(daoTimelockSigner)
    .grantRole(ethers.utils.id('PROPOSER_ROLE'), addresses.tribalCouncilSafe);
  expect(await contracts.tribalCouncilTimelock.hasRole(ethers.utils.id('PROPOSER_ROLE'), addresses.tribalCouncilSafe));

  // Propose using the TC safe on the TC timelock
  const tcSafeSigner = await getImpersonatedSigner(addresses.tribalCouncilSafe);
  await forceEth(addresses.tribalCouncilSafe);
  const dummyRole = ethers.utils.id('DUMMY_2_ROLE');
  const registryTCData = contracts.roleBastion.interface.encodeFunctionData('createRole', [dummyRole]);
  await contracts.tribalCouncilTimelock.connect(tcSafeSigner).schedule(
    addresses.roleBastion,
    0,
    registryTCData,
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000005',
    86400 * 4 // minDelay
  );

  // Verify scheduled
  const timelockProposalId = await contracts.tribalCouncilTimelock.hashOperation(
    addresses.roleBastion,
    0,
    registryTCData,
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x0000000000000000000000000000000000000000000000000000000000000005'
  );
  expect(await contracts.tribalCouncilTimelock.isOperation(timelockProposalId)).to.be.true;
};

export { deploy, setup, teardown, validate };
