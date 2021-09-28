import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc } from '../../types/types';

/*

DAO Proposal #9001

Description:

Steps:
  1 - 
  2 -
  3 - 

*/

const fipNumber = '9001'; // Change me!

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Here we'll mock the DAO proposal steps (in simulation).
// We don't need to do any checks here, as those will be in validate.
const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {
  console.log(`No actions to complete in run for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate = async (addresses, oldContracts, contracts) => {
  console.log(`No actions to complete in validate for fip${fipNumber}`);
};

export { setup, run, teardown, validate };
