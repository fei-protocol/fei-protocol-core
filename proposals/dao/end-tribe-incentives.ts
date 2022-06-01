import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner } from '@test/helpers';

/*

TIP-109: Discontinue Tribe Incentives

Ends all Tribe Incentives being distributed

Steps:
1. Mass update all pools registered for Tribe rewards, so they have all rewards they are entitled to so far
2. Set TribalChief block reward to zero, to stop distributing new rewards
*/

const fipNumber = 'TIP-109: Discontinue Tribe Incentives';

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
  const tribe = contracts.tribe;
  const tribalChief = contracts.tribalChief;

  // 1. Verify TribalChief block rewards are 0
  expect(await tribalChief.tribePerBlock()).to.equal(0);

  // 2. Validate that can harvest Tribe rewards
  const receiver = '0xbEA4B2357e8ec53AF60BbcA4bc570332a7C7E232';
  const initialBalance = await tribe.balanceOf(receiver);

  const poolId = 0; // UniswapV2 Fei-Tribe LP pool

  const stakerInFeiTribe = '0x7d809969f6a04777f0a87ff94b57e56078e5fe0f';
  const stakerInFeiTribeSigner = await getImpersonatedSigner(stakerInFeiTribe);

  await tribalChief.connect(stakerInFeiTribeSigner).harvest(poolId, receiver);
  const finalBalance = await tribe.balanceOf(receiver);

  expect(finalBalance.sub(initialBalance)).to.be.bignumber.at.least(0);
};

export { deploy, setup, teardown, validate };
