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

DAO Proposal #9001

Description:

Steps:
  1 -
  2 -
  3 -

*/

const fipNumber = '9001'; // Change me!

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
  expect((await contracts.d3poolConvexPCVDeposit.balance()) / 1).to.be.greaterThan(0);
  expect(await contracts.d3poolCurvePCVDeposit.balance()).to.be.equal(0);
  expect(await contracts.core.hasRole(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), contracts.optimisticTimelock.address))
    .to.be.false;
  expect(await contracts.ethPSM.reservesThreshold()).to.be.equal(ethers.constants.WeiPerEther.mul('250'));
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  expect(await contracts.d3poolConvexPCVDeposit.balance()).to.be.equal(0);
  expect((await contracts.d3poolCurvePCVDeposit.balance()) / 1).to.be.greaterThan(0);
  expect(await contracts.core.hasRole(ethers.utils.id('PCV_GUARDIAN_ADMIN_ROLE'), contracts.optimisticTimelock.address))
    .to.be.true;
  expect(await contracts.ethPSM.reservesThreshold()).to.be.equal(ethers.constants.WeiPerEther.mul('5000'));
};

export { deploy, setup, teardown, validate };
