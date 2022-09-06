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

const toBN = ethers.BigNumber.from;

/*

Deprecate Optimistic Governance and Tribal Council

*/

// Lower bounds on the old Rari vested TRIBE and FEI
const OLD_RARI_VESTED_TRIBE_LOWER = '471669647387113140537798';
const OLD_RARI_VESTED_FEI_LOWER = '471669393708777270421106';

// Timelock roles
const TC_PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
const TC_CANCELLER_ROLE = ethers.utils.id('CANCELLER_ROLE');
const TC_EXECUTOR_ROLE = ethers.utils.id('EXECUTOR_ROLE');
const TC_TIMELOCK_ADMIN_ROLE = ethers.utils.id('TIMELOCK_ADMIN_ROLE');

let initialCoreTribeBalance: BigNumber;
let initialDAOFeiBalance: BigNumber;

const fipNumber = 'deprecate_tc'; // Change me!

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
  // 1. Verify Core Treasury received old Rari vested TRIBE
  const coreTribeBalanceDiff = (await contracts.tribe.balanceOf(addresses.core)).sub(initialCoreTribeBalance);
  expect(coreTribeBalanceDiff).to.be.bignumber.greaterThan(toBN(OLD_RARI_VESTED_TRIBE_LOWER));

  // 2. Verify DAO timelock received Rari vested FEI
  expect(
    (await contracts.fei.balanceOf(addresses.feiDAOTimelock)).sub(initialDAOFeiBalance)
  ).to.be.bignumber.greaterThan(toBN(OLD_RARI_VESTED_FEI_LOWER));

  // 3. No verification of Tribe Roles revocations - there is a seperate e2e permissions test that does that

  // 4. Verify that timelock roles have been revoked
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_PROPOSER_ROLE, addresses.tribalCouncilSafe)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_EXECUTOR_ROLE, addresses.tribalCouncilSafe)).to.be.false;
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_EXECUTOR_ROLE, addresses.podExecutorV2)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_CANCELLER_ROLE, addresses.tribalCouncilSafe)).to.be.false;
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_CANCELLER_ROLE, addresses.podAdminGateway)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_TIMELOCK_ADMIN_ROLE, addresses.tribalCouncilTimelock)).to.be
    .false;

  // 5. Verify that old Rari FEI/TRIBE vesting timelock pending admins set to burner FEI and TRIBE timelocks
  // TODO: Once audit complete
  // expect(await contracts.rariInfraFeiTimelock.pendingBeneficiary()).to.equal(addresses.feiBurnerTimelock);
  // expect(await contracts.rariInfraTribeTimelock.pendingBeneficiary()).to.equal(addresses.tribeBurnerTimelock);
};

export { deploy, setup, teardown, validate };
