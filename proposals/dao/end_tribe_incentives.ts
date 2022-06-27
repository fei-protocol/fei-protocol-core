import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

TIP-109: Discontinue Tribe Incentives

Ends all Tribe Incentives being distributed. 

Specifically:
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
  const stakeAmount = ethers.constants.WeiPerEther.mul(40_000);
  const curve3Metapool = '0x06cb22615BA53E60D67Bf6C341a0fD5E718E1655';
  const curvePoolId = 1;
  const curve3LPWhale = '0xdc69d4cb5b86388fff0b51885677e258883534ae';
  const curveLPStaker = await getImpersonatedSigner(curve3LPWhale);
  const curveLPToken = await ethers.getContractAt('ERC20', curve3Metapool);

  await forceEth(curve3LPWhale);
  await curveLPToken.connect(curveLPStaker).approve(contracts.tribalChief.address, stakeAmount);
  await contracts.tribalChief.connect(curveLPStaker).deposit(curvePoolId, stakeAmount, 0);

  // Set the pool to have a non-zero AP, so can test can claim rewards
  const daoSigner = await getImpersonatedSigner(addresses.feiDAOTimelock);
  await contracts.tribalChief.connect(daoSigner).set(curvePoolId, 500, ethers.constants.AddressZero, false);
  await time.increase(86400 * 7);
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

  expect(
    await contracts.core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalChiefSyncV2)
  ).to.equal(false);

  expect(await contracts.core.hasRole(ethers.utils.id('FUSE_ADMIN'), addresses.tribalChiefSyncV2)).to.equal(false);
  expect(await contracts.core.hasRole(ethers.utils.id('VOTIUM_ADMIN_ROLE'), addresses.opsOptimisticTimelock)).to.equal(
    false
  );

  // 1. Verify TribalChief block rewards are effectively 0
  expect(await tribalChief.tribePerBlock()).to.equal(NEW_TRIBE_BLOCK_REWARD);

  // 2. Validate number of pools is as expected
  const poolIds = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17];
  const numPools = await tribalChief.numPools();
  expect(numPools).to.equal(poolIds.length);

  // 3. Validate that all pool AP points are set to zero, apart from Fei-Tribe Uniswap V2
  const feiRariPoolId = '0';
  for (const pid in poolIds) {
    const poolInfo = await tribalChief.poolInfo(pid);

    if (pid == feiRariPoolId) {
      expect(poolInfo.allocPoint).to.be.equal(NEW_TOTAL_ALLOC_POINTS.toString());
    } else {
      expect(poolInfo.allocPoint).to.be.equal('0');
    }
  }

  // 4. Verify rewardsDistributorAdmin internal ACL revoked
  const rewardsDistributorAdmin = contracts.rewardsDistributorAdmin;
  expect(
    await rewardsDistributorAdmin.hasRole(
      ethers.utils.id('AUTO_REWARDS_DISTRIBUTOR_ROLE'),
      addresses.feiDaiAutoRewardsDistributor
    )
  ).to.equal(false);

  expect(
    await rewardsDistributorAdmin.hasRole(
      ethers.utils.id('AUTO_REWARDS_DISTRIBUTOR_ROLE'),
      addresses.feiUsdcAutoRewardsDistributor
    )
  ).to.equal(false);

  expect(
    await rewardsDistributorAdmin.hasRole(
      ethers.utils.id('AUTO_REWARDS_DISTRIBUTOR_ROLE'),
      addresses.autoRewardsDistributor
    )
  ).to.equal(false);

  expect(
    await rewardsDistributorAdmin.hasRole(
      ethers.utils.id('AUTO_REWARDS_DISTRIBUTOR_ROLE'),
      addresses.d3AutoRewardsDistributor
    )
  ).to.equal(false);

  expect(
    await rewardsDistributorAdmin.hasRole(
      ethers.utils.id('AUTO_REWARDS_DISTRIBUTOR_ROLE'),
      addresses.fei3CrvAutoRewardsDistributor
    )
  ).to.equal(false);

  // 5. Verify total AP points is 1
  expect(await tribalChief.totalAllocPoint()).to.be.equal(NEW_TOTAL_ALLOC_POINTS.toString());

  // 6. Verify an AutoRewardDistributor speed is set correctly
  const d3Ctoken = await contracts.rariPool8Comptroller.cTokensByUnderlying(addresses.curveD3pool);

  const d3RewardSpeed = await contracts.d3AutoRewardsDistributor.getNewRewardSpeed();
  expect(d3RewardSpeed[1]).to.equal(false); // updateNeeded
  expect(d3RewardSpeed[0]).to.equal(0); // newSpeed

  const delegatorReportedSpeed = await contracts.rariRewardsDistributorDelegator.compSupplySpeeds(d3Ctoken);
  expect(delegatorReportedSpeed).to.equal(0);
};

export { deploy, setup, teardown, validate };
