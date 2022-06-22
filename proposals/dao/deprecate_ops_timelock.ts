import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

Deprecate ops timelock

*/

const fipNumber = 'deprecate_ops_timelock'; // Change me!

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
  const core = contracts.core;

  // 1. Validate no longer has roles
  expect(await core.hasRole(ethers.utils.id('METAGOVERNANCE_VOTE_ADMIN'), addresses.opsOptimisticTimelock)).to.be.false;
  expect(await core.hasRole(ethers.utils.id('METAGOVERNANCE_TOKEN_STAKING'), addresses.opsOptimisticTimelock)).to.be
    .false;
  expect(await core.hasRole(ethers.utils.id('ORACLE_ADMIN_ROLE'), addresses.opsOptimisticTimelock)).to.be.false;
};

export { deploy, setup, teardown, validate };
