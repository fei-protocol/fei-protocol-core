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

  describe('first suite', () => {
    beforeEach(async function () {
      this.core = await getCore();

      this.tribe = await (await ethers.getContractFactory('MockTribe')).deploy();
      this.coreRef = await (await ethers.getContractFactory('MockCoreRef')).deploy(this.core.address);

      // spin up the logic contract
      const tribalChief = await (await ethers.getContractFactory('TribalChief')).deploy(this.core.address);
      // create a new proxy contract
      const proxyContract = await (
        await ethers.getContractFactory('TransparentUpgradeableProxy', impersonatedSigners[userAddress])
      ).deploy(tribalChief.address, tribalChief.address, '0x');

      // instantiate the tribalchief pointed at the proxy contract
      this.tribalChief = await ethers.getContractAt('TribalChief', proxyContract.address);

      // initialize the tribalchief
      await this.tribalChief.connect((await ethers.getSigners())[0]).initialize(this.core.address, this.tribe.address);
      await this.tribalChief.connect(await ethers.getSigner(governorAddress)).updateBlockReward(blockReward);

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
      await this.tribe.connect(impersonatedSigners[minterAddress]).mint(this.tribalChief.address, mintAmount);

      // create new reward stream
      const transactionResponse: TransactionResponse = await this.tribalChief
        .connect(impersonatedSigners[governorAddress])
        .add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject.concat([
            {
              lockLength: 100,
              rewardMultiplier: '11000'
            }
          ])
        );

      await transactionResponse.wait();
      // grab PID from the logs
      pid = 0; //txReceipt.logs[1]
      //console.log(`pid: ${pid}`)
      // grab the per block reward by calling the tribalChief contract
      perBlockReward = Number((await this.tribalChief.tribePerBlock()).toString());
    });

    describe('Test Security', () => {
      it('should not be able to add rewards stream as non governor', async function () {
        await expectRevert(
          this.tribalChief
            .connect(impersonatedSigners[userAddress])
            .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject),
          'CoreRef: Caller is not a governor'
        );
      });

      it('should not be able to add rewards stream with 0 allocation points', async function () {
        await expectRevert(
          this.tribalChief
            .connect(impersonatedSigners[governorAddress])
            .add(0, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject),
          'pool must have allocation points to be created'
        );
      });

      it('should not be able to unlockPool as non governor', async function () {
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[userAddress]).unlockPool(pid),
          'CoreRef: Caller is not a governor'
        );
      });

      it('should be able to unlockPool as governor', async function () {
        await this.tribalChief.connect(impersonatedSigners[governorAddress]).unlockPool(pid);
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.true;
      });

      it('should be able to lockPool as governor', async function () {
        await this.tribalChief.connect(impersonatedSigners[governorAddress]).lockPool(pid);
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.false;
      });

      it('should not be able to lockPool as non governor', async function () {
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[userAddress]).lockPool(pid),
          'CoreRef: Caller is not a governor'
        );
      });

      it('should not be able to change rewards multiplier as non governor', async function () {
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[userAddress]).governorAddPoolMultiplier(pid, 0, 0),
          'CoreRef: Caller is not a governor'
        );
      });

      it('should not be able to resetRewards as non governor', async function () {
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[userAddress]).resetRewards(pid),
          'CoreRef: Caller is not a guardian or governor'
        );
      });

      it('should be able to resetRewards as governor', async function () {
        expect((await this.tribalChief.poolInfo(pid)).allocPoint).to.be.equal(toBN(allocationPoints));
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.false;

        await expect(await this.tribalChief.connect(impersonatedSigners[governorAddress]).resetRewards(pid))
          .to.emit(this.tribalChief, 'PoolLocked')
          .withArgs(false, toBN(pid));

        // assert that pool is unlocked, total and pool allocation points are now 0
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.true;
        expect((await this.tribalChief.poolInfo(pid)).allocPoint).to.be.equal(toBN('0'));
        expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('0'));
      });

      it('governor should be able to add rewards stream', async function () {
        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);
        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);
        expect((await this.tribalChief.poolInfo(1)).allocPoint).to.be.equal(toBN(allocationPoints));
      });

      it('should not be able to set rewards stream as non governor', async function () {
        await expectRevert(
          this.tribalChief
            .connect(impersonatedSigners[userAddress])
            .set(0, allocationPoints, this.LPToken.address, true),
          'CoreRef: Caller is not a governor'
        );
      });

      it('should not be able to set total allocation points to 0', async function () {
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[governorAddress]).set(0, 0, this.LPToken.address, true),
          'total allocation points cannot be 0'
        );
      });

      it('governor should be able to set rewards stream with new amount of allocation points', async function () {
        const newAllocationPoints = 10;
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .set(0, newAllocationPoints, this.LPToken.address, true);
        expect((await this.tribalChief.poolInfo(pid)).allocPoint).to.be.equal(toBN(newAllocationPoints));
      });

      it('should not be able to governorWithdrawTribe as non governor', async function () {
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[userAddress]).governorWithdrawTribe('100000000', {}),
          'CoreRef: Caller is not a governor'
        );
      });

      it('should be able to governorWithdrawTribe as governor', async function () {
        // assert that core's tribe balance before doing the governor withdraw is 0
        let coreBalance = await this.tribe.balanceOf(this.core.address);
        expect(coreBalance).to.be.equal(toBN('0'));

        const withdrawAmount = await this.tribe.balanceOf(this.tribalChief.address);
        expect(withdrawAmount).to.be.equal(mintAmount);
        /*await expect(*/
        await this.tribalChief.connect(impersonatedSigners[governorAddress]).governorWithdrawTribe(withdrawAmount);
        /*.to.emit(this.tribalChief, 'TribeWithraw').withArgs(withdrawAmount)*/

        coreBalance = await this.tribe.balanceOf(this.core.address);
        expect(coreBalance).to.be.equal(mintAmount);

        const afterTribalChiefBalance = await this.tribe.balanceOf(this.tribalChief.address);
        expect(afterTribalChiefBalance).to.be.equal(toBN('0'));
      });

      it('should not be able to updateBlockReward as non governor', async function () {
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[userAddress]).updateBlockReward('100000000', {}),
          'CoreRef: Caller is not a governor'
        );
      });

      it('governor should be able to updateBlockReward', async function () {
        const newBlockRewards = [1000000000, 2000000000, 3000000000, 4000000000, 5000000000, 6000000000];

        expect(await this.tribalChief.tribePerBlock()).to.be.equal(toBN('100000000000000000000'));
        for (let i = 0; i < newBlockRewards.length; i++) {
          // update the block reward
          await expect(
            await this.tribalChief.connect(impersonatedSigners[governorAddress]).updateBlockReward(newBlockRewards[i])
          )
            .to.emit(this.tribalChief, 'NewTribePerBlock')
            .withArgs(toBN(newBlockRewards[i].toString()));

          // assert this new block reward is in place
          expect(await this.tribalChief.tribePerBlock()).to.be.equal(toBN(newBlockRewards[i]));
        }
      });

      it('governor should be able to pause the TribalChief', async function () {
        expect(await this.tribalChief.paused()).to.be.false;
        await expect(await this.tribalChief.connect(impersonatedSigners[governorAddress]).pause())
          .to.emit(this.tribalChief, 'Paused')
          .withArgs(governorAddress);

        expect(await this.tribalChief.paused()).to.be.true;
      });

      it('user should not be able to deposit when the TribalChief is paused', async function () {
        expect(await this.tribalChief.paused()).to.be.false;
        await expect(await this.tribalChief.connect(impersonatedSigners[governorAddress]).pause())
          .to.emit(this.tribalChief, 'Paused')
          .withArgs(governorAddress);
        expect(await this.tribalChief.paused()).to.be.true;

        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await expectRevert(
          this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {}),
          'Pausable: paused'
        );
      });
    });

    describe('Test accTribePerShare', () => {
      it('should be able to get correct accTribePerShare after 100 blocks', async function () {
        const userAddresses = [userAddress];

        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(toBN(0));

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          1,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < 98; i++) {
          await time.advanceBlock();
        }

        await this.tribalChief.updatePool(pid);

        const expectedAccTribePerShare = toBN(100)
          .mul(toBN(blockReward).mul(toBN(ACC_TRIBE_PRECISION)))
          .div(toBN(totalStaked));

        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(expectedAccTribePerShare);
      });

      it('should be able to get correct accTribePerShare after 10 blocks', async function () {
        const userAddresses = [userAddress];

        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(toBN(0));

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          1,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < 8; i++) {
          await time.advanceBlock();
        }

        await this.tribalChief.updatePool(pid);

        const expectedAccTribePerShare = toBN(10)
          .mul(toBN(blockReward).mul(toBN(ACC_TRIBE_PRECISION)))
          .div(toBN(totalStaked));

        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(expectedAccTribePerShare);
      });

      it('should be able to get correct accTribePerShare after resetting rewards', async function () {
        const userAddresses = [userAddress];

        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(toBN(0));

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          1,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < 8; i++) {
          await time.advanceBlock();
        }

        await this.tribalChief.connect(impersonatedSigners[governorAddress]).resetRewards(pid, {});

        const expectedAccTribePerShare = toBN(10)
          .mul(toBN(blockReward).mul(toBN(ACC_TRIBE_PRECISION)))
          .div(toBN(totalStaked));

        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(expectedAccTribePerShare);

        const { allocPoint } = await this.tribalChief.poolInfo(pid);
        // alloc points are now 0
        expect(toBN(0)).to.be.equal(allocPoint);
        const rewards = await this.tribalChief.pendingRewards(pid, userAddress);
        const expectedRewards = expectedAccTribePerShare.mul(toBN(totalStaked)).div(toBN(ACC_TRIBE_PRECISION));
        expect(rewards).to.be.equal(expectedRewards);
      });

      it('should be able to get correct accTribePerShare after setting allocation points to 0', async function () {
        const userAddresses = [userAddress];

        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(toBN(0));

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          1,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < 6; i++) {
          await time.advanceBlock();
        }

        // update pool before we add a new one to preserve rewards
        await this.tribalChief.updatePool(pid);
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.curveLPToken.address, ZERO_ADDRESS, defaultRewardsObject);

        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await this.tribalChief.connect(impersonatedSigners[governorAddress]).set(pid, 0, ZERO_ADDRESS, false, {});

        // tribe per share from first 8 blocks, full reward
        const expectedAccTribePerShareFirst8Blocks = toBN(8)
          .mul(toBN(blockReward).mul(toBN(ACC_TRIBE_PRECISION)))
          .div(toBN(totalStaked));

        // tribe per share from last 2 blocks, which was cut in half
        const expectedAccTribePerShareLast2Blocks = toBN(2)
          .mul(toBN(blockReward).div(toBN(2)).mul(toBN(ACC_TRIBE_PRECISION)))
          .div(toBN(totalStaked));

        const totalAccTribePerShare = expectedAccTribePerShareLast2Blocks.add(expectedAccTribePerShareFirst8Blocks);

        // ensure that tribePerShare incremented correctly
        expect((await this.tribalChief.poolInfo(pid)).accTribePerShare).to.be.equal(totalAccTribePerShare);

        const { allocPoint } = await this.tribalChief.poolInfo(pid);

        // alloc points are now 0 for this pool
        expect(toBN(0)).to.be.equal(allocPoint);
        const rewards = await this.tribalChief.pendingRewards(pid, userAddress);
        const expectedRewards = totalAccTribePerShare.mul(toBN(totalStaked)).div(toBN(ACC_TRIBE_PRECISION));
        expect(rewards).to.be.equal(expectedRewards);
      });

      it('should be able to deposit multiple times and withdrawAllAndHarvest', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await expect(await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 100))
          .to.emit(this.tribalChief, 'Deposit')
          .withArgs(userAddress, toBN(pid.toString()), toBN(totalStaked), toBN('0'));

        for (let i = 0; i < 5; i++) {
          await time.advanceBlock();
        }

        const startingLPBalance = await this.LPToken.balanceOf(userAddress);
        const rewards = await this.tribalChief.pendingRewards(pid, userAddress);
        await this.tribalChief.connect(impersonatedSigners[userAddress]).withdrawAllAndHarvest(pid, userAddress, {});

        // tribe per share from first 5 blocks, full reward
        const expectedAccTribeFirst5Blocks = toBN(5).mul(toBN(blockReward));
        await expectApprox(rewards, expectedAccTribeFirst5Blocks);
        // assert that no LP tokens were withdrawn when calling withdrawAllAndHarvest
        expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(startingLPBalance);

        await this.LPToken.mint(userAddress, totalStaked);
        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await expect(await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 100))
          .to.emit(this.tribalChief, 'Deposit')
          .withArgs(userAddress, toBN(pid.toString()), toBN(totalStaked), toBN('1'));
      });
    });

    describe('Test Staking', () => {
      it('should be able to stake LP Tokens', async function () {
        expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked));

        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await expect(await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0))
          .to.emit(this.tribalChief, 'Deposit')
          .withArgs(userAddress, toBN(pid.toString()), toBN(totalStaked), toBN('0'));

        expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN('0'));

        // grab the index by getting the amount of deposit they have and subtracting 1
        const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(toBN('1')).toString();
        // assert user has received their balance in
        // the tribalChief contract registered under their account
        expect((await this.tribalChief.depositInfo(pid, userAddress, index)).amount).to.be.equal(toBN(totalStaked));
      });

      it('should be able to get pending tribe', async function () {
        const userAddresses = [userAddress];

        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        await this.tribalChief.withdrawAllAndHarvest(pid, userAddress);
      });

      it('should be able to get pending tribe', async function () {
        const userAddresses = [userAddress];

        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        await this.tribalChief.harvest(pid, userAddress);
        await this.tribalChief.withdrawAllAndHarvest(pid, userAddress);
      });

      it('should be able to get pending sushi', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {});

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(Number(await this.tribalChief.pendingRewards(pid, userAddress))).to.be.equal(
          perBlockReward * advanceBlockAmount
        );
      });

      it('should be able to get pending sushi after one block with a single pool and user staking', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {});

        await time.advanceBlock();

        expect(Number((await this.tribalChief.pendingRewards(pid, userAddress)).toString())).to.be.equal(
          perBlockReward
        );
      });

      it('should be able to step down rewards by creating a new PID for curve with equal allocation points after 10 blocks, then go another 10 blocks', async function () {
        await this.LPToken.connect(impersonatedSigners[userAddress]).approve(this.tribalChief.address, totalStaked, {});
        await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {});

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(Number((await this.tribalChief.pendingRewards(pid, userAddress)).toString())).to.be.equal(
          perBlockReward * advanceBlockAmount
        );

        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});

        // add on one to the advance block amount as we have advanced
        // one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        // adding another PID for curve will cut user rewards
        // in half for users staked in the first pool
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.curveLPToken.address, ZERO_ADDRESS, defaultRewardsObject);

        const pid2 = 1; //Number(addTx.logs[0].args.pid);
        await this.curveLPToken
          .connect(impersonatedSigners[secondUserAddress])
          .approve(this.tribalChief.address, totalStaked);
        await this.tribalChief.connect(impersonatedSigners[secondUserAddress]).deposit(pid2, totalStaked, 0, {});

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // we did 5 tx's before starting and then do 1 tx to harvest so start with i at 3.
        for (let i = 5; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});

        // for 7 blocks, we received half of the rewards of one pool.
        // For one block after the 10 blocks, we received 100% of all block rewards
        expect(await this.tribe.balanceOf(userAddress)).to.be.equal(
          toBN(((perBlockReward / 2) * (advanceBlockAmount - 3) + perBlockReward).toString()).add(startingTribeBalance)
        );

        await this.tribalChief.connect(impersonatedSigners[secondUserAddress]).harvest(pid2, secondUserAddress, {});

        // subtract 2 from the advance block amount as we have advanced
        // two less blocks when calling the harvest function
        expect(Number(await this.tribe.balanceOf(secondUserAddress))).to.be.equal(
          (perBlockReward / 2) * (advanceBlockAmount - 3)
        );
      });

      // this test will test what happens when we update the block
      // reward after a user has already accrued rewards
      it('should be able to step down rewards by halving rewards per block after 10 blocks, then go another 10 blocks', async function () {
        await this.LPToken.connect(impersonatedSigners[userAddress]).approve(this.tribalChief.address, totalStaked, {});
        await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {});

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(Number((await this.tribalChief.pendingRewards(pid, userAddress)).toString())).to.be.equal(
          perBlockReward * advanceBlockAmount
        );

        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});

        // add on one to the advance block amount as we have
        // advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .updateBlockReward('50000000000000000000', {});

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // we did 3 tx's before starting so start with i at 3.
        for (let i = 3; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        const expectedAmount = startingTribeBalance.add(
          toBN(((perBlockReward / 2) * (advanceBlockAmount - 1)).toString())
        );
        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});
        expect(await this.tribe.balanceOf(userAddress)).to.be.equal(expectedAmount);
      });

      it('should be able to step down rewards by creating a new PID with equal allocation points after 10 blocks, then go another 5 blocks', async function () {
        await this.LPToken.connect(impersonatedSigners[userAddress]).approve(this.tribalChief.address, totalStaked, {});
        await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {});

        const advanceBlockAmount = 10;

        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(Number((await this.tribalChief.pendingRewards(pid, userAddress)).toString())).to.be.equal(
          perBlockReward * advanceBlockAmount
        );

        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});

        // add on one to the advance block amount as we have advanced
        // one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // adding another PID will cut user rewards in half for users staked in the first pool
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);

        // we did 2 tx's before starting so start with i at 2.
        for (let i = 2; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});
        const endingTribeBalance = await this.tribe.balanceOf(userAddress);
        const rewardAmount = endingTribeBalance.sub(startingTribeBalance);

        expect(rewardAmount).to.be.equal(toBN(((perBlockReward / 2) * advanceBlockAmount).toString()));
      });

      it('should be able to get pending sushi after 10 blocks', async function () {
        await this.LPToken.connect(impersonatedSigners[userAddress]).approve(this.tribalChief.address, totalStaked, {});
        await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {});

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(Number((await this.tribalChief.pendingRewards(pid, userAddress)).toString())).to.be.equal(
          perBlockReward * advanceBlockAmount
        );

        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});
        // add on one to the advance block amount as we have
        // advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));
      });

      it('should be able to get pending sushi 10 blocks with 2 users staking', async function () {
        await this.LPToken.connect(impersonatedSigners[userAddress]).approve(this.tribalChief.address, totalStaked, {});
        await this.LPToken.connect(impersonatedSigners[secondUserAddress]).approve(
          this.tribalChief.address,
          totalStaked,
          {}
        );

        await this.tribalChief.connect(impersonatedSigners[userAddress]).deposit(pid, totalStaked, 0, {});
        await this.tribalChief.connect(impersonatedSigners[secondUserAddress]).deposit(pid, totalStaked, 0, {});

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        // validate that the balance of the user is correct before harvesting rewards
        expect(Number(await this.tribalChief.pendingRewards(pid, userAddress))).to.be.equal(
          (perBlockReward * advanceBlockAmount) / 2 + perBlockReward
        );
        expect(Number(await this.tribalChief.pendingRewards(pid, secondUserAddress))).to.be.equal(
          (perBlockReward * advanceBlockAmount) / 2
        );

        await this.tribalChief.connect(impersonatedSigners[secondUserAddress]).harvest(pid, secondUserAddress, {});
        // add on one to the advance block amount as we have advanced
        // one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(secondUserAddress))).to.be.equal(
          (perBlockReward * (advanceBlockAmount + 1)) / 2
        );

        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});
        // add on two to the advance block amount as we have advanced two
        // more blocks before calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(
          (perBlockReward * advanceBlockAmount) / 2 + perBlockReward * 2
        );
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress, fifthUserAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('20000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );
      });

      it('should be able to getTotalStakedInPool with one user depositing multiple times', async function () {
        const userAddresses = [userAddress];
        await this.LPToken.mint(userAddress, toBN(10).mul(toBN(totalStaked)));
        for (let i = 0; i < 10; i++) {
          const amountOfDeposits = i + 1;

          await testMultipleUsersPooling(
            this.tribalChief,
            this.LPToken,
            userAddresses,
            toBN('100000000000000000000'),
            1,
            0,
            totalStaked,
            pid
          );

          // expected amount staked is totalstaked * amountOfDeposits
          const expectedTotalStaked = toBN(totalStaked).mul(toBN(amountOfDeposits));
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddress);

          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 4 users staking using helper function', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('25000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);

          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 2 users staking using helper function', async function () {
        const userAddresses = [userAddress, secondUserAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('50000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);

          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 10 users staking using helper function', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
          fifthUserAddress,
          sixthUserAddress,
          seventhUserAddress,
          eigthUserAddress,
          ninthUserAddress,
          tenthUserAddress
        ];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);

          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 3 pools, 3 users staking in each pool', async function () {
        expect(await this.tribalChief.numPools()).to.be.equal(toBN('1'));
        expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('100'));

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, linearRewardObject);

        const secondPid = 1; //Number(tx.logs[0].args.pid);
        expect(await this.tribalChief.numPools()).to.be.equal(toBN('2'));
        expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('200'));

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, linearRewardObject);
        // grab PID from the logs
        const thirdPid = 2; //Number(tx.logs[0].args.pid);
        expect(await this.tribalChief.numPools()).to.be.equal(toBN('3'));
        expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('300'));

        const userAddressesFirstList = [userAddress, secondUserAddress, thirdUserAddress];
        const userAdddressesSecondList = [fourthUserAddress, fifthUserAddress, sixthUserAddress];
        const userAdddressesThirdList = [seventhUserAddress, eigthUserAddress, ninthUserAddress];

        // pool 1, all users deposit with a locklength of 100
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddressesFirstList,
          toBN('11111111110000000000'),
          1,
          100,
          totalStaked,
          pid
        );

        // pool 2, 3 user deposits with different locklengths
        const lockLengths = [100, 200, 300];
        const rewardArrayPoolTwo = [
          toBN('5555555550000000000'),
          toBN('11111111110000000000'),
          toBN('16666666660000000000')
        ];
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAdddressesSecondList,
          rewardArrayPoolTwo,
          3,
          lockLengths,
          totalStaked,
          secondPid
        );

        // pool 3, 1 user deposits with different locklengths
        const lockLengthsPoolThree = [250, 250, 500];
        const rewardArrayPoolThree = [
          toBN('8333333330000000000'),
          toBN('8333333330000000000'),
          toBN('16666666660000000000')
        ];
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAdddressesThirdList,
          rewardArrayPoolThree,
          3,
          lockLengthsPoolThree,
          totalStaked,
          thirdPid
        );

        async function testFailureWithdraw(poolPid, users, tribalChief) {
          for (const user of users) {
            await expectRevert(
              tribalChief.connect(impersonatedSigners[user]).withdrawFromDeposit(poolPid, totalStaked, user, 0),
              'tokens locked'
            );
          }
        }

        // assert that all tokens are still locked as 100 blocks has not passed
        await testFailureWithdraw(pid, userAddressesFirstList, this.tribalChief);
        await testFailureWithdraw(secondPid, userAdddressesSecondList, this.tribalChief);
        await testFailureWithdraw(thirdPid, userAdddressesThirdList, this.tribalChief);
      });

      it('should be able to distribute sushi after 10 blocks with 10 users staking using helper function and 2 staking PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
          fifthUserAddress,
          sixthUserAddress,
          seventhUserAddress,
          eigthUserAddress,
          ninthUserAddress,
          tenthUserAddress
        ];

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);

        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('5000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);

          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);
        }
      });

      it('should be able to assert numPools', async function () {
        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      });
    });

    describe('Test Withdraw and Staking', () => {
      it('should be able to distribute sushi after 10 blocks with 10 users staking using helper function and 2 staking PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
          fifthUserAddress,
          sixthUserAddress,
          seventhUserAddress,
          eigthUserAddress,
          ninthUserAddress,
          tenthUserAddress
        ];

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);

        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('5000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);

          await this.tribalChief
            .connect(impersonatedSigners[userAddresses[i]])
            .withdrawAllAndHarvest(pid, userAddresses[i]);

          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 2 staking PIDs', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress, fifthUserAddress];

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);

        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddresses[i]);
          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);

          await this.tribalChief
            .connect(impersonatedSigners[userAddresses[i]])
            .withdrawAllAndHarvest(pid, userAddresses[i]);

          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 1 staking PIDs', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress, fifthUserAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('20000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddresses[i]);
          await this.tribalChief
            .connect(impersonatedSigners[userAddresses[i]])
            .withdrawAllAndHarvest(pid, userAddresses[i]);

          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 2 users staking using helper function and 5 staking PIDs', async function () {
        const userAddresses = [userAddress, secondUserAddress];

        const startingAllocPoints = await this.tribalChief.totalAllocPoint();
        expect(startingAllocPoints).to.be.equal(toBN(allocationPoints.toString()));
        // only add 4 pools as the before each hook always adds 1 pool

        for (let i = 1; i < 5; i++) {
          await this.tribalChief
            .connect(impersonatedSigners[governorAddress])
            .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);
          expect(Number(await this.tribalChief.numPools())).to.be.equal(1 + i);
        }

        // assert that allocation points are correct and are now at 500
        expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN((allocationPoints * 5).toString()));
        // assert that we have 5 pools
        expect(Number(await this.tribalChief.numPools())).to.be.equal(5);

        // this reward should be ( 1e20 / 5 pools / 2 users ) = 2000000000000000000,
        // however, the actual reward is 10000000000000000000
        // if you take 1e20 and divide by ( 5 * 2), then the reward per block per user is 1e19,
        // so then this math makes sense
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddresses[i]);
          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);

          await this.tribalChief
            .connect(impersonatedSigners[userAddresses[i]])
            .withdrawAllAndHarvest(pid, userAddresses[i]);

          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 4 users staking using helper function and 1 staking PIDs', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('25000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);

          await this.tribalChief
            .connect(impersonatedSigners[userAddresses[i]])
            .withdrawAllAndHarvest(pid, userAddresses[i]);

          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 2 staking PIDs', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress, fifthUserAddress];

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);
        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddresses[i]);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);

          await this.tribalChief
            .connect(impersonatedSigners[userAddresses[i]])
            .withdrawAllAndHarvest(pid, userAddresses[i]);

          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.gt(pendingTribe);
        }
      });
    });

    describe('Test Withdraw and Harvest Scenarios', () => {
      it('should be able to distribute sushi after 10 blocks with 10 users staking by withdrawing and then harvest with 2 PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
          fifthUserAddress,
          sixthUserAddress,
          seventhUserAddress,
          eigthUserAddress,
          ninthUserAddress,
          tenthUserAddress
        ];

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, defaultRewardsObject);

        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('5000000000000000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const address = userAddresses[i];

          expect(await this.LPToken.balanceOf(address)).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(address)).to.be.equal(toBN('0'));

          const pendingTribeBeforeHarvest = await this.tribalChief.pendingRewards(pid, address);

          // assert that getTotalStakedInPool returns proper amount
          const expectedTotalStaked = toBN(totalStaked);
          const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddresses[i]);
          expect(expectedTotalStaked).to.be.equal(poolStakedAmount);

          const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(toBN('1')).toString();
          await this.tribalChief
            .connect(impersonatedSigners[address])
            .withdrawFromDeposit(pid, totalStaked, address, index);

          expect(await this.LPToken.balanceOf(address)).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(address)).to.be.equal(toBN('0'));

          // assert that reward debt went negative after we withdrew
          // all of our principle without harvesting
          expect((await this.tribalChief.userInfo(pid, address)).rewardDebt).to.be.lt(toBN('-1'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, address);
          expect(pendingTribe).to.be.gt(pendingTribeBeforeHarvest);

          await this.tribalChief.connect(impersonatedSigners[address]).harvest(pid, address, {});
          const tribeBalance = await this.tribe.balanceOf(address);
          expect(tribeBalance).to.be.gte(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 3 users staking by withdrawing and then harvesting with 2 PIDs', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress];

        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('33333333333300000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const address = userAddresses[i];

          expect(await this.LPToken.balanceOf(address)).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(address)).to.be.equal(toBN('0'));

          // subtract 1 from the amount of deposits
          const pendingTribeBeforeHarvest = await this.tribalChief.pendingRewards(pid, address);

          const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(toBN('1')).toString();
          await this.tribalChief
            .connect(impersonatedSigners[address])
            .withdrawFromDeposit(pid, totalStaked, address, index);

          expect(await this.LPToken.balanceOf(address)).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(address)).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, address);
          expect(pendingTribe).to.be.gt(pendingTribeBeforeHarvest);

          await this.tribalChief.connect(impersonatedSigners[address]).harvest(pid, address, {});
          const tribeBalance = await this.tribe.balanceOf(address);
          expect(tribeBalance).to.be.gte(pendingTribe);
        }
      });

      it('pendingRewards should be able to get all rewards data across multiple deposits in a single pool', async function () {
        const userAddresses = [userAddress, userAddress];

        await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
        await this.LPToken.approve(this.tribalChief.address, toBN(totalStaked).mul(toBN('2')));

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN(blockReward),
          1,
          0,
          totalStaked,
          pid
        );

        await this.tribalChief.harvest(pid, userAddress);
        // should get per block reward 3x.
        // 1 block to do 2nd deposit,
        // 1 block to advance,
        // 1 block for the harvest
        expect(await this.tribe.balanceOf(userAddress)).to.be.equal(toBN('300000000000000000000'));
      });

      it('pendingRewards should be able to get all rewards data across 5 deposits in a single pool', async function () {
        const userAddresses = [userAddress, userAddress, userAddress, userAddress, userAddress];

        await this.LPToken.mint(userAddress, toBN(totalStaked).mul(toBN('5'))); // approve double total staked
        await this.LPToken.approve(this.tribalChief.address, toBN(totalStaked).mul(toBN('5')));

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN(blockReward),
          1,
          0,
          totalStaked,
          pid
        );

        // assert that getTotalStakedInPool returns proper amount
        const expectedTotalStaked = toBN(totalStaked).mul(toBN(5));
        const poolStakedAmount = await this.tribalChief.getTotalStakedInPool(pid, userAddress);
        expect(expectedTotalStaked).to.be.equal(poolStakedAmount);

        await this.tribalChief.harvest(pid, userAddress);
        // should get per block reward 6x.
        // 4 blocks to do 2nd, 3rd, 4th and 5th deposit,
        // 1 block to advance,
        // 1 block for the harvest
        // we lose about 0.0000000017% on this harvest, so we need to use expect approx
        await expectApprox(await this.tribe.balanceOf(userAddress), toBN(blockReward).mul(toBN('6')));
      });

      it('pendingRewards should be able to get all rewards data across 10 deposits in a single pool', async function () {
        const userAddresses = [
          userAddress,
          userAddress,
          userAddress,
          userAddress,
          userAddress,
          userAddress,
          userAddress,
          userAddress,
          userAddress,
          userAddress
        ];

        await this.LPToken.mint(userAddress, toBN(totalStaked).mul(toBN('10'))); // approve double total staked
        await this.LPToken.approve(this.tribalChief.address, toBN(totalStaked).mul(toBN('10')));

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN(blockReward),
          1,
          0,
          totalStaked,
          pid
        );

        await this.tribalChief.harvest(pid, userAddress);
        // should get per block reward 11x.
        // 9 blocks to do 2nd, through 10th deposit,
        // 1 block to advance,
        // 1 block for the harvest
        // we lose about 0.0000000017% on this harvest, so we need to use expect approx
        await expectApprox(await this.tribe.balanceOf(userAddress), toBN(blockReward).mul(toBN('11')));
      });

      it('pendingRewards should be able to get all rewards data across a single deposit in a pool', async function () {
        const userAddresses = [userAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN(blockReward),
          5,
          0,
          totalStaked,
          pid
        );

        await this.tribalChief.harvest(pid, userAddress);
        expect(await this.tribe.balanceOf(userAddress)).to.be.equal(toBN('600000000000000000000'));
      });

      it('harvest should be able to claim all rewards from multiple deposits in a single pool', async function () {
        const userAddresses = [userAddress, userAddress, secondUserAddress];

        await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
        await this.LPToken.approve(this.tribalChief.address, toBN(totalStaked).mul(toBN('2')));

        const incrementAmount = [
          toBN('66666666666600000000'), // user one should receive 2/3 of block rewards
          toBN('66666666666600000000'),
          toBN('33333333333300000000') // user two should receive 1/3 of block rewards
        ];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          incrementAmount,
          1,
          0,
          totalStaked,
          pid
        );
        // users pending rewards for both deposits should be 2x increment amount
        // user got 2 blocks of full rewards so subtract block reward x 2 from their balance

        // grab all deposits and withdraw them without harvesting rewards
        const depositAmounts = Number(await this.tribalChief.openUserDeposits(pid, userAddress));
        for (let i = 0; i < depositAmounts; i++) {
          const startingLP = await this.LPToken.balanceOf(userAddress);
          await this.tribalChief
            .connect(impersonatedSigners[userAddress])
            .withdrawFromDeposit(pid, totalStaked, userAddress, i);
          const endingLP = await this.LPToken.balanceOf(userAddress);

          // ensure the users LPToken balance increased
          expect(startingLP.add(toBN(totalStaked))).to.be.equal(endingLP);
        }

        const startingTribe = await this.tribe.balanceOf(userAddress);
        expect(startingTribe).to.be.equal(toBN('0'));

        // get all of the pending rewards for this user
        const allPendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
        // harvest all rewards
        await this.tribalChief.connect(impersonatedSigners[userAddress]).harvest(pid, userAddress, {});
        const endingTribe = await this.tribe.balanceOf(userAddress);
        expect(endingTribe).to.be.equal(allPendingTribe);

        // ensure user does not have any pending rewards remaining
        const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
        expect(pendingTribe).to.be.equal(toBN('0'));
      });
    });

    describe('Governor Rewards Changes', () => {
      it('governor should be able to step up the pool multiplier, which unlocks users funds', async function () {
        // assert that this pool is locked
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.false;

        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .governorAddPoolMultiplier(pid, 100, multiplier20.toString());

        // assert that this pool is now unlocked
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.true;
        expect((await this.tribalChief.rewardMultipliers(pid, 100)).toString()).to.be.equal(multiplier20);
      });

      it('governor should be able to step down the pool multiplier and not unlock the pool', async function () {
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .governorAddPoolMultiplier(pid, 100, oneMultiplier);
        // assert that the pool did not unlock
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.false;
        expect(await this.tribalChief.rewardMultipliers(pid, 100)).to.be.equal(oneMultiplier);

        // now have a user test and ensure this new reward is given
        const userAddresses = [userAddress];
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          3,
          100,
          totalStaked,
          pid
        );
      });

      it('governor should be able to step up the pool multiplier, pool unlocks and rewards should be given for 90 blocks', async function () {
        await this.tribalChief
          .connect(impersonatedSigners[governorAddress])
          .governorAddPoolMultiplier(pid, 100, multiplier20);

        // assert that the pool did unlock
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.true;
        expect(await this.tribalChief.rewardMultipliers(pid, 100)).to.be.equal(multiplier20);
        // now have a user test and ensure this new reward is given

        const userAddresses = [userAddress];
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('100000000000000000000'),
          3,
          100,
          totalStaked,
          pid
        );
      });

      it('tribalChief should revert when adding a new rewards pool without any multplier data', async function () {
        await expectRevert(
          this.tribalChief
            .connect(impersonatedSigners[governorAddress])
            .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, []),
          'must specify rewards'
        );
      });

      it('tribalChief should revert when adding a new rewards pool with an invalid 0 lock length multiplier', async function () {
        await expectRevert(
          this.tribalChief
            .connect(impersonatedSigners[governorAddress])
            .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, [
              {
                lockLength: 0,
                rewardMultiplier: 0
              }
            ]),
          'invalid multiplier for 0 lock length'
        );
      });

      it('tribalChief should revert when adding a new rewards pool with a multiplier below scale factor', async function () {
        await expectRevert(
          this.tribalChief
            .connect(impersonatedSigners[governorAddress])
            .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, [
              {
                lockLength: 10,
                rewardMultiplier: 0
              }
            ]),
          'invalid multiplier, must be above scale factor'
        );
      });
    });

    describe('Gas Benchmarking', () => {
      beforeEach(async function () {
        this.lockLength = 100;
      });

      it('benchmarking depositing LP Tokens', async function () {
        const userAddresses = [userAddress, secondUserAddress];

        for (let j = 0; j < userAddresses.length; j++) {
          const address = userAddresses[j];
          for (let i = 1; i < 5; i++) {
            await this.LPToken.mint(address, totalStaked);
            await this.LPToken.connect(impersonatedSigners[address]).approve(this.tribalChief.address, totalStaked, {});
            const tx: TransactionReceipt = await (
              await this.tribalChief.connect(impersonatedSigners[address]).deposit(pid, totalStaked, 0, {})
            ).wait();
            const obj = {
              gas: tx.gasUsed,
              msg: `user ${j} gas used for deposit ${i}`
            };
            depositReport.push(obj);
          }
        }
      });

      it('benchamarking withdrawFromDeposit and harvest with multiple users', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress];

        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          toBN('33333333333300000000'),
          10,
          0,
          totalStaked,
          pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const address = userAddresses[i];

          expect(await this.LPToken.balanceOf(address)).to.be.equal(toBN('0'));
          expect(await this.tribe.balanceOf(address)).to.be.equal(toBN('0'));

          // subtract 1 from the amount of deposits
          const pendingTribeBeforeHarvest = await this.tribalChief.pendingRewards(pid, address);

          const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(toBN('1')).toString();
          const tx: TransactionReceipt = await (
            await this.tribalChief
              .connect(impersonatedSigners[address])
              .withdrawFromDeposit(pid, totalStaked, address, index)
          ).wait();
          const obj = {
            gas: tx.gasUsed,
            msg: `user ${i} withdraws from deposit`
          };
          withdrawFromDepositReport.push(obj);

          expect(await this.LPToken.balanceOf(address)).to.be.equal(toBN(totalStaked));
          expect(await this.tribe.balanceOf(address)).to.be.equal(toBN('0'));

          const pendingTribe = await this.tribalChief.pendingRewards(pid, address);
          expect(pendingTribe).to.be.gt(pendingTribeBeforeHarvest);

          const harvestTx: TransactionReceipt = await (
            await this.tribalChief.connect(impersonatedSigners[address]).harvest(pid, address, {})
          ).wait();
          harvestReport.push({
            gas: harvestTx.gasUsed,
            msg: `user ${i} harvests`
          });
          const tribeBalance = await this.tribe.balanceOf(address);
          expect(tribeBalance).to.be.gte(pendingTribe);
        }
      });

      it('benchmarking withdrawAllAndHarvest with multiple deposits', async function () {
        const userAddresses = [userAddress];

        for (let i = 1; i < 20; i++) {
          await testMultipleUsersPooling(
            this.tribalChief,
            this.LPToken,
            userAddresses,
            toBN('100000000000000000000'),
            0,
            0,
            totalStaked,
            pid
          );

          const tx: TransactionReceipt = await (
            await this.tribalChief.connect(impersonatedSigners[userAddress]).withdrawAllAndHarvest(pid, userAddress)
          ).wait();
          const obj = {
            gas: tx.gasUsed,
            msg: `gas used withdrawing all and harvesting with ${i} deposits`
          };
          withdrawAllAndHarvestReport.push(obj);

          expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked).mul(toBN(i.toString())));

          // ensure that the reward debt got zero'd out
          // virtual amount should go to 0
          const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
          expect(rewardDebt).to.be.equal(toBN('0'));
          expect(virtualAmount).to.be.equal(toBN('0'));
          // ensure that the open user deposits got zero'd out and array is 0 length
          expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('0'));
          // ensure that the virtual total supply got zero'd as well
          expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));

          await this.LPToken.mint(userAddress, totalStaked);
          userAddresses.push(userAddress);
        }
      });

      it('benchmarking emergency withdraw with multiple deposits', async function () {
        const userAddresses = [userAddress];

        for (let i = 1; i < 20; i++) {
          await testMultipleUsersPooling(
            this.tribalChief,
            this.LPToken,
            userAddresses,
            toBN('100000000000000000000'),
            0,
            0,
            totalStaked,
            pid
          );

          const tx: TransactionReceipt = await (
            await this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress)
          ).wait();
          const obj = {
            gas: tx.gasUsed,
            msg: `gas used doing an emergency withdraw with ${i} deposits`
          };
          emergencyWithdrawReport.push(obj);
          userAddresses.push(userAddress);

          expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN(totalStaked).mul(toBN(i.toString())));

          // ensure that the reward debt got zero'd out
          // virtual amount should go to 0
          const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
          expect(rewardDebt).to.be.equal(toBN('0'));
          expect(virtualAmount).to.be.equal(toBN('0'));
          // ensure that the open user deposits got zero'd out and array is 0 length
          expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('0'));
          // ensure that the virtual total supply got zero'd as well
          expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));

          await this.LPToken.mint(userAddress, totalStaked);
        }
      });

      it('benchmarking withdrawAllAndHarvest', async function () {
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
        expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN('0'));

        const pendingTribe = await this.tribalChief.pendingRewards(pid, userAddress);
        const tx: TransactionReceipt = await this.tribalChief
          .connect(impersonatedSigners[userAddress])
          .withdrawAllAndHarvest(pid, userAddress);
        const obj = {
          gas: tx.gasUsed,
          msg: 'gas used withdrawing all and harvesting when tokens are locked and only harvesting with 1 deposit'
        };
        withdrawAllAndHarvestReport.push(obj);

        expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await this.tribe.balanceOf(userAddress)).to.be.gte(pendingTribe);
      });

      it('', async () => {
        function printData(data, message) {
          console.log(message);
          data.forEach((e) => {
            console.log(`${e.msg} ${e.gas}`);
          });
        }

        printData(emergencyWithdrawReport, '\n\n\n~~~~~~~~~~~~ Emergency Withdraw Report ~~~~~~~~~~~~\n');
        printData(withdrawAllAndHarvestReport, '\n\n\n~~~~~~~~~~~~ Withdaw All And Harvest Report ~~~~~~~~~~~~\n');
        printData(withdrawFromDepositReport, '\n\n\n~~~~~~~~~~~~ Withdaw From Deposit Report ~~~~~~~~~~~~\n');
        printData(harvestReport, '\n\n\n~~~~~~~~~~~~ Harvest Report ~~~~~~~~~~~~\n');
        printData(depositReport, '\n\n\n~~~~~~~~~~~~ Deposit Report ~~~~~~~~~~~~\n');
      });
    });
  });
});
