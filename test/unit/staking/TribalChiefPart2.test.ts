/* eslint-disable no-restricted-syntax */
/* eslint-disable max-len */
/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
import { time } from '../../helpers';
import { expectRevert, expectUnspecifiedRevert, getCore, getAddresses, expectApprox } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider';

const toBN = ethers.BigNumber.from;

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const uintMax = '115792089237316195423570985008687907853269984665640564039457584007913129639935';
const ACC_TRIBE_PRECISION = toBN('100000000000000000000000');
const blockReward = '100000000000000000000';

const impersonatedSigners: { [key: string]: Signer } = {};

async function testMultipleUsersPooling(
  tribalChief,
  lpToken,
  userAddresses,
  incrementAmount,
  blocksToAdvance,
  lockLength,
  totalStaked,
  pid
) {
  // if lock length isn't defined, it defaults to 0
  lockLength = lockLength === undefined ? 0 : lockLength;

  // approval loop
  for (let i = 0; i < userAddresses.length; i++) {
    if (!impersonatedSigners[userAddresses[i]]) {
      throw new Error(`No signer for ${userAddresses[i]}`);
    }
    await lpToken.connect(impersonatedSigners[userAddresses[i]]).approve(tribalChief.address, uintMax);
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

    const currentIndex = await tribalChief.openUserDeposits(pid, userAddresses[i]);
    await expect(
      await tribalChief.connect(impersonatedSigners[userAddresses[i]]).deposit(pid, totalStaked, lockBlockAmount)
    )
      .to.emit(tribalChief, 'Deposit')
      .withArgs(userAddresses[i], toBN(pid.toString()), toBN(totalStaked), currentIndex);
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

const emergencyWithdrawReport = [];
const withdrawAllAndHarvestReport = [];
const withdrawFromDepositReport = [];
const harvestReport = [];
const depositReport = [];

describe('TribalChief', () => {
  // this is the process ID of the staking rewards that we will use
  let pid;
  let minterAddress;
  let governorAddress;
  let userAddress;
  let secondUserAddress;
  let thirdUserAddress;
  let fourthUserAddress;
  let fifthUserAddress;
  let sixthUserAddress;
  let seventhUserAddress;
  let eigthUserAddress;
  let ninthUserAddress;
  let tenthUserAddress;
  let perBlockReward;

  const multiplier10x = '100000';
  const multiplier5x = '50000';
  const multiplier3x = '30000';
  // rewards multiplier by 2.5x
  const multiplier2point5x = '25000';
  const multiplier2x = '20000';

  const multiplier20 = '12000';
  const multiplier40 = '14000';
  const oneMultiplier = '10000';
  const defaultRewardsObject = [
    {
      lockLength: 0,
      rewardMultiplier: oneMultiplier
    },
    {
      lockLength: 1000,
      rewardMultiplier: multiplier10x
    }
  ];

  const linearRewardObject = [
    {
      lockLength: 100,
      rewardMultiplier: oneMultiplier
    },
    {
      lockLength: 200,
      rewardMultiplier: multiplier2x
    },
    {
      lockLength: 250,
      rewardMultiplier: multiplier2point5x
    },
    {
      lockLength: 300,
      rewardMultiplier: multiplier3x
    },
    {
      lockLength: 400,
      rewardMultiplier: multiplier40
    },
    {
      lockLength: 500,
      rewardMultiplier: multiplier5x
    }
  ];

  // allocation points we will use to initialize a pool with
  const allocationPoints = 100;

  // this is the amount of LP tokens that we will mint to users
  // 1e28 is the maximum amount that we can have as the total amount any one user stakes,
  // above that, the reward calculations don't work properly.
  // This is also the amount of LP tokens that will be staked into the tribalChief contract
  const totalStaked = '100000000000000000000000000000000000';
  // this is the amount of tribe we will mint to the tribalChief contract
  const mintAmount = toBN('1000000000000000000000000000000000000000000000');

  before(async () => {
    const addresses = await getAddresses();

    if (!addresses.governorAddress) {
      throw new Error('governor address not found');
    }

    userAddress = addresses.userAddress;
    secondUserAddress = addresses.secondUserAddress;
    thirdUserAddress = addresses.beneficiaryAddress1;
    fourthUserAddress = addresses.minterAddress;
    fifthUserAddress = addresses.burnerAddress;
    sixthUserAddress = addresses.pcvControllerAddress;
    seventhUserAddress = addresses.governorAddress;
    eigthUserAddress = addresses.genesisGroup;
    ninthUserAddress = addresses.guardianAddress;
    tenthUserAddress = addresses.beneficiaryAddress2;
    governorAddress = addresses.governorAddress;
    minterAddress = addresses.minterAddress;

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      userAddress,
      secondUserAddress,
      thirdUserAddress,
      fourthUserAddress,
      fifthUserAddress,
      sixthUserAddress,
      seventhUserAddress,
      eigthUserAddress,
      ninthUserAddress,
      tenthUserAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.minterAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2,
      addresses.guardianAddress,
      addresses.burnerAddress
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  describe('Test Rewards Multiplier', () => {
    beforeEach(async function () {
      this.core = await getCore();

      this.tribe = await (await ethers.getContractFactory('MockTribe')).deploy();
      this.coreRef = await (await ethers.getContractFactory('MockCoreRef')).deploy(this.core.address);

      // spin up the logic contract
      const tribalChief = await (await ethers.getContractFactory('TribalChief')).deploy(this.core.address);
      // create a new proxy contract
      const proxyContract = await (
        await ethers.getContractFactory('TransparentUpgradeableProxy')
      ).deploy(tribalChief.address, tribalChief.address, '0x');

      // instantiate the tribalchief pointed at the proxy contract
      this.tribalChief = await ethers.getContractAt('TribalChief', proxyContract.address);

      // initialize the tribalchief
      await this.tribalChief.initialize(this.core.address, this.tribe.address);

      await this.tribalChief.connect(impersonatedSigners[governorAddress]).updateBlockReward(blockReward, {});

      // create and mint LP tokens
      this.curveLPToken = await (await ethers.getContractFactory('MockERC20')).deploy();
      await this.curveLPToken.mint(userAddress, totalStaked);
      await this.curveLPToken.mint(secondUserAddress, totalStaked);

      this.LPToken = await (await ethers.getContractFactory('MockERC20')).deploy();
      await this.LPToken.mint(userAddress, totalStaked);
      await this.LPToken.mint(secondUserAddress, totalStaked);
      await this.LPToken.mint(thirdUserAddress, totalStaked);
      await this.LPToken.mint(fourthUserAddress, totalStaked);
      await this.LPToken.mint(fifthUserAddress, totalStaked);
      await this.LPToken.mint(sixthUserAddress, totalStaked);
      await this.LPToken.mint(seventhUserAddress, totalStaked);
      await this.LPToken.mint(eigthUserAddress, totalStaked);
      await this.LPToken.mint(ninthUserAddress, totalStaked);
      await this.LPToken.mint(tenthUserAddress, totalStaked);

      // mint tribe tokens to the tribalChief contract to distribute as rewards
      await this.tribe.connect(impersonatedSigners[minterAddress]).mint(this.tribalChief.address, mintAmount, {});

      this.multiplier = multiplier20;
      this.lockLength = 100;
      // create new reward stream
      const tx: TransactionResponse = await this.tribalChief
        .connect(impersonatedSigners[governorAddress])
        .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, [
          {
            lockLength: 100,
            rewardMultiplier: oneMultiplier
          },
          {
            lockLength: 300,
            rewardMultiplier: toBN(oneMultiplier).mul(toBN('3')).toString()
          },
          {
            lockLength: 1000,
            rewardMultiplier: multiplier10x
          }
        ]);

      await tx.wait();

      // grab PID from the logs
      pid = 0; //Number(txReceipt.logs[0].topics[1]);
    });

    it('should be able to mass update pools', async function () {
      await this.tribalChief
        .connect(impersonatedSigners[governorAddress])
        .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, [
          {
            lockLength: 100,
            rewardMultiplier: oneMultiplier
          },
          {
            lockLength: 300,
            rewardMultiplier: toBN(oneMultiplier).mul(toBN('3')).toString()
          }
        ]);

      await this.tribalChief.massUpdatePools([0, 1]);
      // assert that both pools got updated last block
      expect((await this.tribalChief.poolInfo(0)).lastRewardBlock).to.be.equal(
        (await this.tribalChief.poolInfo(1)).lastRewardBlock
      );

      // ensure that the last reward block isn't 0 for both pools
      expect((await this.tribalChief.poolInfo(0)).lastRewardBlock).to.be.gt(toBN('0'));
    });

    it('should be able to update a single pool', async function () {
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        [userAddress],
        toBN('100000000000000000000'),
        1,
        this.lockLength,
        totalStaked,
        pid
      );

      const { accTribePerShare, lastRewardBlock } = await this.tribalChief.poolInfo(pid);
      await this.tribalChief.updatePool(pid);

      const newAccTribePerShare = (await this.tribalChief.poolInfo(pid)).accTribePerShare;
      const newRewardBlock = (await this.tribalChief.poolInfo(pid)).lastRewardBlock;

      expect(newAccTribePerShare).to.be.gt(accTribePerShare);
      expect(newRewardBlock).to.be.gt(lastRewardBlock);
    });

    it('should be able to get pending sushi and receive multiplier for locking', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        10,
        this.lockLength,
        totalStaked,
        pid
      );
    });

    it('should be able to get pending sushi and receive 10x multiplier for locking', async function () {
      // add 99 pools with the same alloc points, then test rewards
      for (let i = 0; i < 99; i++) {
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, linearRewardObject);
      }

      // ensure we now have 100 pools that will each receive 1 tribe per block
      expect(Number(await this.tribalChief.numPools())).to.be.equal(100);

      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('1000000000000000000'),
        10,
        1000,
        totalStaked,
        pid
      );

      const { amount, multiplier } = await this.tribalChief.depositInfo(pid, userAddress, 0);
      // assert that this user has a deposit with a 10x multiplier and the correct amount credited to their deposit and virtual liquidity
      expect(multiplier).to.be.equal(toBN(multiplier10x));
      expect(amount).to.be.equal(toBN(totalStaked));

      // assert that the virtual amount is equal to 10x the amount they deposited
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.equal(amount.mul(toBN('10')));

      // formula for reward debt
      // (amount * multiplier) / SCALE_FACTOR
      // (virtualAmountDelta * pool.accTribePerShare) / ACC_TRIBE_PRECISION
      const { accTribePerShare } = await this.tribalChief.poolInfo(0);
      const expectedRewardDebt = toBN(totalStaked).mul(toBN('10')).mul(accTribePerShare).div(ACC_TRIBE_PRECISION);
      expect(rewardDebt).to.be.equal(expectedRewardDebt);
    });

    it('should not be able to deposit with an unsupported locklength', async function () {
      await this.LPToken.connect(impersonatedSigners[userAddress]).approve(this.tribalChief.address, totalStaked);
      await expectRevert(
        this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 100000),
        'invalid lock length'
      );
    });

    it('should not be able to deposit without LPToken approval', async function () {
      await expectRevert(
        this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 100),
        'transfer amount exceeds allowance'
      );
    });

    it('should not be able to withdraw before locking period is over', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid
      );

      await expectRevert(
        this.tribalChief
          .connect(impersonatedSigners[userAddress])
          .withdrawFromDeposit(pid, totalStaked, userAddress, 0),
        'tokens locked'
      );
    });

    it('should not be able to withdraw more tokens than deposited', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        100,
        this.lockLength,
        totalStaked,
        pid
      );

      await expectUnspecifiedRevert(
        this.tribalChief
          .connect(impersonatedSigners[userAddress])
          .withdrawFromDeposit(pid, toBN(totalStaked).mul(toBN('20')), userAddress, 0)
      );
    });

    it('should be able to withdraw before locking period is over when governor force unlocks pool', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid
      );

      await this.tribalChief.connect(impersonatedSigners[governorAddress]).unlockPool(pid);
      expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.true;

      await this.tribalChief
        .connect(impersonatedSigners[userAddress])
        .withdrawFromDeposit(pid, totalStaked, userAddress, 0);

      // ensure lp tokens were refunded and reward debt went negative
      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked));
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(rewardDebt).to.be.lt(toBN('-1'));
      expect(virtualAmount).to.be.eq(toBN('0'));
    });

    it('should not be able to emergency withdraw before locking period is over', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid
      );

      await expectRevert(
        this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress),
        'tokens locked'
      );
    });

    it('should not be able to withdraw principle before locking period is over by calling withdrawAllAndHarvest', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid
      );

      const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      await this.tribalChief.connect(impersonatedSigners[userAddress]).withdrawAllAndHarvest(pid, userAddress);
      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN('0'));
      expect(await this.tribe.balanceOf(userAddress)).to.be.gte(pendingTribe);
    });

    it('should be able to `to` address when calling withdrawAllAndHarvest, all tribe rewards and principle are paid out to the specified user', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        this.lockLength, // we should advance lock length blocks so that once the function is complete we can withdraw
        this.lockLength,
        totalStaked,
        pid
      );

      const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      const secondUserStartingLPTokenBalance = await this.LPToken.balanceOf(secondUserAddress);
      // assert that this user has 0 tribe to begin with before receiving proceeds from the harvest
      expect(await this.tribe.balanceOf(secondUserAddress)).to.be.equal(toBN('0'));

      await this.tribalChief.connect(impersonatedSigners[userAddress]).withdrawAllAndHarvest(pid, secondUserAddress);

      // ensure that the rewards and LPToken got paid out to the second user address that we specified
      expect(await this.LPToken.balanceOf(secondUserAddress)).to.be.equal(
        toBN(totalStaked).add(secondUserStartingLPTokenBalance)
      );
      expect(await this.tribe.balanceOf(secondUserAddress)).to.be.gte(pendingTribe);
    });

    it('should be able to withdraw principle after locking period is over by calling withdrawAllAndHarvest', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        this.lockLength,
        this.lockLength,
        totalStaked,
        pid
      );

      const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      await this.tribalChief.connect(impersonatedSigners[userAddress]).withdrawAllAndHarvest(pid, userAddress);
      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked));
      expect(await this.tribe.balanceOf(userAddress)).to.be.gte(pendingTribe);
      // assert that virtual amount and reward debt updated correctly
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.equal(toBN('0'));
      expect(rewardDebt).to.be.equal(toBN('0'));
      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));
    });

    it('calling withdrawAllAndHarvest after lockup period should delete arrays when all liquidity is withdrawn from that pool', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        50,
        this.lockLength,
        totalStaked,
        pid
      );

      await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
      await this.LPToken.approve(this.tribalChief.address, totalStaked);
      await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, this.lockLength);
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('2'));
      // assert that the virtual total supply is equal
      // to the staked amount which is total staked x 2
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN(totalStaked).mul(toBN('2')));

      for (let i = 0; i < 50; i++) {
        await time.advanceBlock();
      }

      let pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      await this.tribalChief
        .connect(impersonatedSigners[userAddress])
        .connect(impersonatedSigners[userAddress])
        .withdrawAllAndHarvest(pid, userAddress, {});

      // there should still be 2 open user deposits as the first deposit just got
      // zero'd out and did not get deleted
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('2'));

      // assert that the deposit info is zero'd out after this users withdraw call
      const { amount, unlockBlock, multiplier } = await this.tribalChief.depositInfo(pid, userAddress, 0);
      expect(amount).to.be.equal(toBN('0'));
      expect(unlockBlock).to.be.equal(toBN('0'));
      expect(multiplier).to.be.equal(toBN('0'));

      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked));
      expect(await this.tribe.balanceOf(userAddress)).to.be.gte(pendingTribe);

      for (let i = 0; i < 50; i++) {
        await time.advanceBlock();
      }
      pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      const currentTribe = await this.tribe.balanceOf(userAddress);
      // assert that the virtual total supply is equal to the staked amount
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN(totalStaked));
      await this.tribalChief.connect(impersonatedSigners[userAddress]).withdrawAllAndHarvest(pid, userAddress, {});
      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked).mul(toBN('2')));

      expect(await this.tribe.balanceOf(userAddress)).to.be.gte(currentTribe.add(pendingTribe));

      // ensure that the open deposits are now 0 as they should have been
      // deleted in the withdrawallandharvest function call
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('0'));

      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));

      // assert that virtual amount and reward debt updated correctly
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.equal(toBN('0'));
      expect(rewardDebt).to.be.equal(toBN('0'));
    });

    it('Negative rewards debt when calling withdrawAllAndHarvest should not revert and should give out correct reward amount', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        this.lockLength,
        this.lockLength,
        totalStaked,
        pid
      );

      const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      await this.tribalChief
        .connect(impersonatedSigners[userAddress])
        .withdrawFromDeposit(pid, totalStaked, userAddress, 0);

      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));

      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked));

      // expect that reward debt goes negative when we withdraw and don't harvest
      expect((await this.tribalChief.userInfo(pid, userAddress)).rewardDebt).to.be.lt(toBN('-1'));

      await this.tribalChief.connect(impersonatedSigners[userAddress]).withdrawAllAndHarvest(pid, userAddress);
      expect(await this.tribe.balanceOf(userAddress)).to.be.gte(pendingTribe);

      // assert that virtual amount and reward debt updated correctly
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.equal(toBN('0'));
      expect(rewardDebt).to.be.equal(toBN('0'));

      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));
    });

    it('Negative rewards debt when calling Harvest should not revert and should give out correct reward amount', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        this.lockLength,
        this.lockLength,
        totalStaked,
        pid
      );

      const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      await this.tribalChief
        .connect(impersonatedSigners[userAddress])
        .withdrawFromDeposit(pid, totalStaked, userAddress, 0);

      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));

      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked));

      // expect that reward debt goes negative when we withdraw and don't harvest
      expect((await this.tribalChief.userInfo(pid, userAddress)).rewardDebt).to.be.lt(toBN('-1'));

      await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});
      expect(await this.tribe.balanceOf(userAddress)).to.be.gte(pendingTribe);

      // assert that virtual amount and reward debt updated correctly
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.equal(toBN('0'));
      expect(rewardDebt).to.be.equal(toBN('0'));

      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));
    });

    it('should be able to withdraw principle after locking period is over by calling withdraw and then harvest', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        this.lockLength,
        this.lockLength,
        totalStaked,
        pid
      );

      const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
      await this.tribalChief
        .connect(impersonatedSigners[userAddress])
        .withdrawFromDeposit(pid, totalStaked, userAddress, 0);
      await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress);

      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked));
      expect(await this.tribe.balanceOf(userAddress)).to.be.gte(pendingTribe);
      // assert that virtual amount and reward debt updated
      // correctly on the withdrawFromDeposit call
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.equal(toBN('0'));
      expect(rewardDebt).to.be.equal(toBN('0'));
      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));
    });
  });
});
