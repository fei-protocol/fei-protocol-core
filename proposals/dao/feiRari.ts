import { expect } from 'chai';
import { utils } from 'ethers';
import { keccak256 } from 'ethers/lib/utils';
import { RunUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import hre, { ethers } from 'hardhat';

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {}
const run: RunUpgradeFunc = async (addresses, oldContracts, contracts, logging = false) => {}
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
    const { autoRewardsDistributor, rewardsDistributorAdmin } = contracts;
    const AUTO_REWARDS_DISTRIBUTOR_ROLE = await rewardsDistributorAdmin.AUTO_REWARDS_DISTRIBUTOR_ROLE();

    /// check that the contracts were wired together properly
    expect(await rewardsDistributorAdmin.hasRole(AUTO_REWARDS_DISTRIBUTOR_ROLE, autoRewardsDistributor.address)).to.be.true;
    expect(await autoRewardsDistributor.rewardsDistributorAdmin()).to.be.equal(rewardsDistributorAdmin.address);
}

export { validate, setup, run, teardown };
