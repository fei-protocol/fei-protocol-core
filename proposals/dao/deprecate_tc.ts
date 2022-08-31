import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';

/*

Deprecate Optimistic Governance and Tribal Council

*/

// Amount of FEI held on the TC
const TC_FEI_BALANCE = '2733169815107120096987175';

// Amount of TRIBE held on the TC
const TC_TRIBE_BALANCE = '2733170474316903966022879';

// Timelock roles
const TC_PROPOSER_ROLE = ethers.utils.id('PROPOSER_ROLE');
const TC_CANCELLER_ROLE = ethers.utils.id('CANCELLER_ROLE');
const TC_EXECUTOR_ROLE = ethers.utils.id('EXECUTOR_ROLE');
const TC_TIMELOCK_ADMIN_ROLE = ethers.utils.id('TIMELOCK_ADMIN_ROLE');

let initialCoreTribeBalance: BigNumber;
let initialFeiSupply: BigNumber;

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
  initialFeiSupply = await contracts.fei.totalSupply();
  initialCoreTribeBalance = await contracts.tribe.balanceOf(addresses.core);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Verify all FEI on the TC burned
  expect(await contracts.fei.balanceOf(addresses.tribalCouncilTimelock)).to.equal(0);
  const feiSupplyDiff = initialFeiSupply.sub(await contracts.fei.totalSupply());
  expect(feiSupplyDiff).to.be.equal(TC_FEI_BALANCE);

  // 2. Verify Core Treasury received TRIBE and non is left on TC timelock
  expect(await contracts.tribe.balanceOf(addresses.tribalCouncilTimelock)).to.equal(0);
  const coreTribeBalanceDiff = (await contracts.tribe.balanceOf(addresses.core)).sub(initialCoreTribeBalance);
  expect(coreTribeBalanceDiff).to.be.equal(TC_TRIBE_BALANCE);

  // 3. No verification of Tribe Roles revocations - there is a seperate e2e permissions test that does that

  // 4. Verify that timelock roles have been revoked
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_PROPOSER_ROLE, addresses.tribalCouncilSafe)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_EXECUTOR_ROLE, addresses.tribalCouncilSafe)).to.be.false;
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_EXECUTOR_ROLE, addresses.podExecutorV2)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_CANCELLER_ROLE, addresses.tribalCouncilSafe)).to.be.false;
  expect(await contracts.tribalCouncilTimelock.hasRole(TC_CANCELLER_ROLE, addresses.podAdminGateway)).to.be.false;

  expect(await contracts.tribalCouncilTimelock.hasRole(TC_TIMELOCK_ADMIN_ROLE, addresses.tribalCouncilTimelock)).to.be
    .false;
};

export { deploy, setup, teardown, validate };
