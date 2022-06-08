import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Core } from '@custom-types/contracts';

/*

TC Proposal: Register Balance Metadata and grant POD_METADATA_ROLES

*/

const fipNumber = 'register_pod_metadata';

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
  const podMetadataRole = ethers.utils.id('POD_METADATA_REGISTER_ROLE');

  const deployer1 = '0x5346b4ff3e924508d33d93f352d11e392a7a9d3b'; // Caleb
  const deployer2 = '0x64c4Bffb220818F0f2ee6DAe7A2F17D92b359c5d'; // Tom
  const deployer3 = '0xE2388f22cf5e328C197D6530663809cc0408a510'; // Joey
  const deployer4 = '0xcE96fE7Eb7186E9F894DE7703B4DF8ea60E2dD77'; // Erwan

  expect(await core.hasRole(podMetadataRole, deployer1));
  expect(await core.hasRole(podMetadataRole, deployer2));
  expect(await core.hasRole(podMetadataRole, deployer3));
  expect(await core.hasRole(podMetadataRole, deployer4));
};

export { deploy, setup, teardown, validate };
