import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { QuadraticTimelockedDelegator } from '@custom-types/contracts';

/*

Clawback


*/

const fipNumber = 'clawback';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy new Rari infra vesting contract
  // 2.
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
  const lipstoneVesting = contracts.lipstoneVesting as QuadraticTimelockedDelegator;
  // 1. Lipstone beneficiary moved over to the DAO timelock
  expect(await lipstoneVesting.beneficiary()).to.be.equal(await addresses.feiDAOTimelock);

  // 2. Beneficiary accepted on Rari's FEI and TRIBE contracts

  // 3. Mint Fei on new contracts
  // 4. Clawback vesting contracts
};

export { deploy, setup, teardown, validate };
