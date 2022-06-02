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
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

/*

TIP-109: Discontinue Tribe Incentives

Ends all Tribe Incentives being distributed. 

Specifically:
- Unlock all pools to release principle
- Set AP rewards of all pools to 0, and set one pool AP reward to 1
- Effectively set Tribe block reward to 0
- Remove CREAM deposit from CR
*/

const NEW_TRIBE_BLOCK_REWARD = 100000;
const NEW_TOTAL_ALLOC_POINTS = 1;

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

  // 0. Validate TC timelock has TRIBAL_CHIEF_ADMIN_ROLE role
  expect(
    await contracts.core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalCouncilTimelock)
  ).to.equal(true);

  // 1. Verify TribalChief block rewards are 0
  expect(await tribalChief.tribePerBlock()).to.equal(NEW_TRIBE_BLOCK_REWARD);

  // 2. Validate number of pools is as expected
  const poolIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const numPools = await tribalChief.numPools();
  expect(numPools).to.equal(poolIds.length);

  // 3. Validate that all pools are unlocked, rewarders are set to 0 and AP points are set to zero, apart from Fei-Rari
  const feiRariPoolId = '3';
  for (const pid in poolIds) {
    const poolInfo = await tribalChief.poolInfo(pid);
    expect(poolInfo.unlocked).to.equal(true);

    if (pid == feiRariPoolId) {
      expect(poolInfo.allocPoint).to.be.equal(NEW_TOTAL_ALLOC_POINTS.toString());
    } else {
      expect(poolInfo.allocPoint).to.be.equal('0');
    }
  }

  // 4. Verify total AP points is 1
  expect(await tribalChief.totalAllocPoint()).to.be.equal(NEW_TOTAL_ALLOC_POINTS.toString());

  // 5. Validate that can harvest Tribe rewards
  const receiver = '0xbEA4B2357e8ec53AF60BbcA4bc570332a7C7E232';
  const initialBalance = await tribe.balanceOf(receiver);

  const poolId = 1;
  // This is a staking token wrapper
  const stakedTokenAddress = '0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655';
  const stakerInPool = '0x019EdcB493Bd91e2b25b70f26D5d9041Fd7EF946';
  const stakerInPoolSigner = await getImpersonatedSigner(stakerInPool);
  await forceEth(stakerInPool);

  const stakedToken = await ethers.getContractAt('StakingTokenWrapper', stakedTokenAddress);

  await tribalChief.connect(stakerInPoolSigner).harvest(poolId, receiver);
  const finalBalance = await tribe.balanceOf(receiver);
  const harvestedTribe = finalBalance.sub(initialBalance);
  console.log('harvested tribe: ', harvestedTribe);
  expect(harvestedTribe).to.be.bignumber.at.least(toBN(1));

  // 6. Validate can withdraw principle from staked pool
  const receiverBalanceBefore = await stakedToken.balanceOf(receiver);
  await tribalChief.connect(stakerInPoolSigner).withdrawAllAndHarvest(poolId, receiver);
  const receiverBalanceAfter = await stakedToken.balanceOf(receiver);
  const withdrawnPrinciple = receiverBalanceAfter.sub(receiverBalanceBefore);
  console.log('withdrawn principle: ', withdrawnPrinciple.toString());

  expect(withdrawnPrinciple).to.be.bignumber.at.least(toBN(1));
};

export { deploy, setup, teardown, validate };
