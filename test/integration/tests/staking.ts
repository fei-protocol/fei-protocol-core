import {
  AutoRewardsDistributor,
  TribalChief,
  TribalChiefSyncExtension,
  TribalChiefSyncV2
} from '@custom-types/contracts';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { BigNumber, Contract } from 'ethers';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, getImpersonatedSigner, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-staking', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('TribalChief', async () => {
    async function testMultipleUsersPooling(
      tribalChief: Contract,
      lpToken: Contract,
      userAddresses: string | any[],
      incrementAmount: string | any[] | BigNumber,
      blocksToAdvance: number,
      lockLength: string | number | any[],
      totalStaked: string,
      pid: number
    ) {
      // if lock length isn't defined, it defaults to 0
      lockLength = lockLength === undefined ? 0 : lockLength;

      // approval loop
      for (let i = 0; i < userAddresses.length; i++) {
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [userAddresses[i]]
        });

        const userSigner = await ethers.getSigner(userAddresses[i]);

        await lpToken.connect(userSigner).approve(tribalChief.address, ethers.constants.MaxUint256);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [userAddresses[i]]
        });
      }

      // deposit loop
      for (let i = 0; i < userAddresses.length; i++) {
        let lockBlockAmount = lockLength;
        if (Array.isArray(lockLength)) {
          lockBlockAmount = lockLength[i];
          if (lockLength.length !== userAddresses.length) {
            throw new Error('invalid lock length');
          }
        }

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [userAddresses[i]]
        });

        const userSigner = await ethers.getSigner(userAddresses[i]);

        await tribalChief.connect(userSigner).deposit(pid, totalStaked, lockBlockAmount);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [userAddresses[i]]
        });
      }

      const pendingBalances = [];
      for (let i = 0; i < userAddresses.length; i++) {
        const balance = toBN(await tribalChief.pendingRewards(pid, userAddresses[i]));
        pendingBalances.push(balance);
      }

      for (let i = 0; i < blocksToAdvance; i++) {
        for (let j = 0; j < pendingBalances.length; j++) {
          pendingBalances[j] = toBN(await tribalChief.pendingRewards(pid, userAddresses[j]));
        }

        await time.advanceBlock();

        for (let j = 0; j < userAddresses.length; j++) {
          let userIncrementAmount = incrementAmount;
          if (Array.isArray(incrementAmount)) {
            userIncrementAmount = incrementAmount[j];
            if (incrementAmount.length !== userAddresses.length) {
              throw new Error('invalid increment amount length');
            }
          }

          await expectApprox(
            toBN(await tribalChief.pendingRewards(pid, userAddresses[j])),
            pendingBalances[j].add(userIncrementAmount)
          );
        }
      }
    }

    async function unstakeAndHarvestAllPositions(
      userAddresses: string | any[],
      pid: number,
      tribalChief: Contract,
      stakedToken: Contract
    ) {
      for (let i = 0; i < userAddresses.length; i++) {
        const address = userAddresses[i];
        const startingStakedTokenBalance = await stakedToken.balanceOf(address);
        const { virtualAmount } = await tribalChief.userInfo(pid, address);
        const stakedTokens = await tribalChief.getTotalStakedInPool(pid, address);

        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [address]
        });

        const userSigner = await ethers.getSigner(address);

        await tribalChief.connect(userSigner).withdrawAllAndHarvest(pid, address);

        await hre.network.provider.request({
          method: 'hardhat_stopImpersonatingAccount',
          params: [address]
        });

        if (virtualAmount.toString() !== '0') {
          const afterStakedTokenBalance = await stakedToken.balanceOf(address);
          expect(afterStakedTokenBalance.eq(startingStakedTokenBalance.add(stakedTokens))).to.be.true;
        }
      }
    }
  });

  describe('FeiRari Tribe Staking Rewards', async () => {
    let tribe: Contract;
    let tribalChief: TribalChief;
    let tribePerBlock: BigNumber;
    let autoRewardsDistributor: AutoRewardsDistributor;
    let rewardsDistributorAdmin: Contract;
    let stakingTokenWrapper: Contract;
    const poolAllocPoints = 1000;
    const pid = 3;
    let optimisticTimelock: SignerWithAddress;
    let totalAllocPoint: BigNumber;

    before(async () => {
      stakingTokenWrapper = contracts.stakingTokenWrapperRari;
      tribalChief = contracts.tribalChief as TribalChief;
      tribePerBlock = await tribalChief.tribePerBlock();

      rewardsDistributorAdmin = contracts.rewardsDistributorAdmin;
      autoRewardsDistributor = contracts.autoRewardsDistributor as AutoRewardsDistributor;
      tribe = contracts.tribe;

      optimisticTimelock = await ethers.getSigner(contracts.optimisticTimelock.address);
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [optimisticTimelock.address]
      });
      await forceEth(optimisticTimelock.address);
    });

    describe('Staking Token Wrapper', async () => {
      it('init staking token wrapper', async function () {
        totalAllocPoint = await tribalChief.totalAllocPoint();
        expect(stakingTokenWrapper.address).to.be.equal(await tribalChief.stakedToken(3));
        expect((await tribalChief.poolInfo(pid)).allocPoint).to.be.bignumber.equal(toBN(poolAllocPoints));
        expect(totalAllocPoint).to.be.gte(toBN(2000));
      });

      it('harvest rewards staking token wrapper', async function () {
        const { rariRewardsDistributorDelegator } = contractAddresses;
        await stakingTokenWrapper.harvest();
        const startingTribeBalance = await tribe.balanceOf(rariRewardsDistributorDelegator);

        const blocksToAdvance = 10;
        for (let i = 0; i < blocksToAdvance; i++) {
          await time.advanceBlock();
        }

        /// add 1 as calling the harvest is another block where rewards are received
        const pendingTribe = toBN(blocksToAdvance + 1)
          .mul(tribePerBlock)
          .mul(toBN(poolAllocPoints))
          .div(totalAllocPoint);

        await expect(await stakingTokenWrapper.harvest())
          .to.emit(tribalChief, 'Harvest')
          .withArgs(stakingTokenWrapper.address, pid, pendingTribe);

        expect((await tribe.balanceOf(rariRewardsDistributorDelegator)).sub(startingTribeBalance)).to.be.equal(
          pendingTribe
        );
      });
    });

    describe('AutoRewardsDistributor', async () => {
      it('should be able to properly set rewards on the rewards distributor', async function () {
        const { rariRewardsDistributorDelegator, rariPool8Tribe } = contractAddresses;
        const tribalChief = contracts.tribalChief as TribalChief;

        const elevenTribe = ethers.constants.WeiPerEther.mul('11');
        const tribeReward = await tribalChief.tribePerBlock();

        const contractTx = await tribalChief.updateBlockReward(elevenTribe);
        await contractTx.wait();

        const rewardsDistributorDelegator = await ethers.getContractAt(
          'IRewardsAdmin',
          rariRewardsDistributorDelegator
        );

        const expectedNewCompSpeed = elevenTribe.mul(`${poolAllocPoints}`).div(totalAllocPoint);
        const [newCompSpeed, updateNeeded] = await autoRewardsDistributor.getNewRewardSpeed();
        expect(toBN(newCompSpeed)).to.be.equal(expectedNewCompSpeed);
        expect(updateNeeded).to.be.true;

        await expect(await autoRewardsDistributor.setAutoRewardsDistribution())
          .to.emit(autoRewardsDistributor, 'SpeedChanged')
          .withArgs(expectedNewCompSpeed);

        const actualNewCompSpeed = await rewardsDistributorDelegator.compSupplySpeeds(rariPool8Tribe);
        expect(actualNewCompSpeed).to.be.equal(expectedNewCompSpeed);

        const actualNewCompSpeedRDA = await rewardsDistributorAdmin.compSupplySpeeds(rariPool8Tribe);
        expect(actualNewCompSpeedRDA).to.be.equal(expectedNewCompSpeed);

        // reset
        await tribalChief.updateBlockReward(tribeReward);
      });
    });

    describe('Supply and Claim', async () => {
      it('succeeds when user supplies tribe and then claims', async () => {
        const { erc20Dripper, rariRewardsDistributorDelegator } = contractAddresses;
        const rewardsDistributorDelegator = await ethers.getContractAt(
          'IRewardsAdmin',
          rariRewardsDistributorDelegator
        );

        const signer = await ethers.getSigner(erc20Dripper);
        await hre.network.provider.request({
          method: 'hardhat_impersonateAccount',
          params: [erc20Dripper]
        });
        await forceEth(erc20Dripper);

        const { rariPool8Tribe } = contracts;
        const mintAmount = await tribe.balanceOf(erc20Dripper);
        await tribe.connect(signer).approve(rariPool8Tribe.address, mintAmount);

        await rariPool8Tribe.connect(signer).mint(mintAmount);

        const blocksToAdvance = 10;
        for (let i = 0; i < blocksToAdvance; i++) {
          await time.advanceBlock();
        }
        await stakingTokenWrapper.harvest();

        const startingTribeBalance = await tribe.balanceOf(erc20Dripper);
        await rewardsDistributorDelegator.claimRewards(erc20Dripper);
        const endingTribeBalance = await tribe.balanceOf(erc20Dripper);
        expect(endingTribeBalance).to.be.gt(startingTribeBalance);
      });
    });

    describe('Guardian Disables Supply Rewards', async () => {
      it('does not receive reward when supply incentives are moved to zero', async () => {
        const { erc20Dripper, multisig, rariRewardsDistributorDelegator } = contractAddresses;
        const signer = await getImpersonatedSigner(multisig);
        const { rariPool8Tribe } = contracts;
        const rewardsDistributorDelegator = await ethers.getContractAt(
          'IRewardsAdmin',
          rariRewardsDistributorDelegator
        );

        await rewardsDistributorAdmin.connect(signer).guardianDisableSupplySpeed(rariPool8Tribe.address);
        expect(await rewardsDistributorDelegator.compSupplySpeeds(rariPool8Tribe.address)).to.be.equal(toBN(0));
        await rewardsDistributorDelegator.claimRewards(erc20Dripper);

        const blocksToAdvance = 10;
        for (let i = 0; i < blocksToAdvance; i++) {
          await time.advanceBlock();
        }

        const startingTribeBalance = await tribe.balanceOf(erc20Dripper);
        await rewardsDistributorDelegator.claimRewards(erc20Dripper);
        const endingTribeBalance = await tribe.balanceOf(erc20Dripper);
        expect(endingTribeBalance).to.be.equal(startingTribeBalance);
      });
    });
  });

  describe('TribalChiefSyncV2', async () => {
    it('auto-sync works correctly', async () => {
      const tribalChiefSync: TribalChiefSyncV2 = contracts.tribalChiefSyncV2 as TribalChiefSyncV2;
      const tribalChiefSyncExtension: TribalChiefSyncExtension =
        contracts.tribalChiefSyncExtension as TribalChiefSyncExtension;

      const tribalChief: TribalChief = contracts.tribalChief as TribalChief;

      const { d3AutoRewardsDistributor, fei3CrvAutoRewardsDistributor, rariRewardsDistributorDelegator } = contracts;
      const distributors = [d3AutoRewardsDistributor.address, fei3CrvAutoRewardsDistributor.address];

      if (!(await tribalChiefSync.isRewardDecreaseAvailable())) {
        await time.increaseTo((await tribalChiefSync.nextRewardTimestamp()).add(toBN(1)));
      }

      while (await tribalChiefSync.isRewardDecreaseAvailable()) {
        const nextRewardRate = await tribalChiefSync.nextRewardsRate();
        doLogging && console.log(`Decreasing to ${nextRewardRate.toString()}`);

        expect(await tribalChief.tribePerBlock()).to.not.be.bignumber.equal(nextRewardRate);
        await tribalChiefSyncExtension.autoDecreaseRewards(distributors);
        expect(await tribalChief.tribePerBlock()).to.be.bignumber.equal(nextRewardRate);

        [d3AutoRewardsDistributor, fei3CrvAutoRewardsDistributor].forEach(async (distributor) => {
          const rewardSpeed = await distributor.getNewRewardSpeed();
          expect(rewardSpeed[1]).to.be.false;
          doLogging && console.log(`rewardSpeed: ${rewardSpeed[0]}`);
          expect(rewardSpeed[0]).to.be.equal(
            await rariRewardsDistributorDelegator.compSupplySpeeds(await distributor.cTokenAddress())
          );
        });

        if (nextRewardRate.toString() !== '6060000000000000000') {
          await time.increaseTo((await tribalChiefSync.nextRewardTimestamp()).add(toBN(1)));
        }
      }
      doLogging && console.log(`Done and checking latest`);

      expect(await time.latest()).to.be.greaterThan(1677628800);
    });
  });
});
