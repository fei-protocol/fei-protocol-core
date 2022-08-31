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

let initialTreasuryBalance: BigNumber;
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
  initialTreasuryBalance = await contracts.tribe.balanceOf(addresses.core);
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

  // 2. Verify Core Treasury received TRIBE and non left on TC timelock
  expect(await contracts.tribe.balanceOf(addresses.tribalCouncilTimelock)).to.equal(0);
};

export { deploy, setup, teardown, validate };
