import { expect } from 'chai';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import { ethers } from 'hardhat';

const toBN = ethers.BigNumber.from;
const e18 = ethers.constants.WeiPerEther;

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};
const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {};
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const poolAllocPoints = 1000;
  const totalAllocPoint = 3100;
  const seventyFiveTribe = toBN('75').mul(toBN(e18));

  const { autoRewardsDistributor, rewardsDistributorAdmin } = contracts;
  const AUTO_REWARDS_DISTRIBUTOR_ROLE = await rewardsDistributorAdmin.AUTO_REWARDS_DISTRIBUTOR_ROLE();

  /// check that the contracts were wired together properly
  expect(await rewardsDistributorAdmin.hasRole(AUTO_REWARDS_DISTRIBUTOR_ROLE, autoRewardsDistributor.address)).to.be
    .true;
  expect(await autoRewardsDistributor.rewardsDistributorAdmin()).to.be.equal(rewardsDistributorAdmin.address);
  const expectedTribePerBlock = seventyFiveTribe.mul(toBN(poolAllocPoints)).div(toBN(totalAllocPoint));
  const [actualTribePerBlock, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
  /// ensure the newly calculated tribe per block is correct
  expect(updateNeeded).to.be.true;
  expect(actualTribePerBlock).to.be.equal(expectedTribePerBlock);
};

export { validate, setup, run, teardown };
