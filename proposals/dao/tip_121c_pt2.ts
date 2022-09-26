import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

TIP_121c (pt 2): Deprecate Tribe DAO and Fei sub-systems

*/

const fipNumber = 'TIP_121c: Deprecate Tribe DAO and Fei sub-systems';

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
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 0. No check for revoked Tribe roles - there is a seperate e2e

  // 1. Verify init impossible to call on core
  await expect(contracts.core.init()).to.be.revertedWith('Initializable: contract is already initialized');

  // 2. Verify PodAdminGateway has CANCELLER_ROLE removed
  expect(await contracts.tribalCouncilTimelock.hasRole(ethers.utils.id('CANCELLER_ROLE'), addresses.podAdminGateway)).to
    .be.false;
};

export { deploy, setup, teardown, validate };
