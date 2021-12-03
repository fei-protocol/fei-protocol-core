import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Signer, utils } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
import { forceEth } from '@test/integration/setup/utils';

const fipNumber = 50;
const SWAP_ADMIN_ROLE = keccak256(utils.toUtf8Bytes('SWAP_ADMIN_ROLE'));
const startingLUSDBalance = ethers.utils.parseEther('78898');
const endingLUSDBalance = ethers.utils.parseEther('90000000');

/*

LUSD Swap

Steps:
  0 - Grant OA SWAP_ADMIN_ROLE
  1 - Call swap on BalancerLBPSwapper with timelock
*/

// Do any deployments
// This should exclusively include new contract deployments
// const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
//   console.log(`No actions to complete in setup for fip${fipNumber}`);
// };

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
  const { core, optimisticTimelock, lusd, lusdPCVDeposit } = contracts;
  const currentLUSDBalance = await lusd.balanceOf(lusdPCVDeposit.address);
  expect(currentLUSDBalance).to.be.gte(startingLUSDBalance);
  expect(currentLUSDBalance).to.be.gte(endingLUSDBalance);
  expect(await core.hasRole(SWAP_ADMIN_ROLE, optimisticTimelock.address)).to.be.true;
};

export { setup, teardown, validate };
