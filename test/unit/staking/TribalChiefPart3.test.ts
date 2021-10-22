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

  describe('Test Pool with Force Lockup', () => {
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
      expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('0'));

      // create new reward stream
      const txResponse: TransactionResponse = await this.tribalChief
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
            lockLength: 0,
            rewardMultiplier: oneMultiplier
          }
        ]);

      await txResponse.wait();

      // grab PID from the logs
      pid = 0; //Number(tx.logs[0].topics[1])
      expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN(allocationPoints.toString()));
      expect(await this.tribalChief.numPools()).to.be.equal(toBN('1'));

      // set allocation points of earlier pool to 0 so that
      // full block rewards are given out to this pool
      expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('100'));

      expect((await this.tribalChief.poolInfo(0)).allocPoint).to.be.equal(toBN(allocationPoints.toString()));
    });

    it('should be able to get allocation points and update allocation points for adding a new pool', async function () {
      expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('100'));
      expect(await this.tribalChief.numPools()).to.be.equal(toBN('1'));
      // create new reward stream
      await this.tribalChief
        .connect(impersonatedSigners[governorAddress])
        .add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, [
          {
            lockLength: 100,
            rewardMultiplier: oneMultiplier
          }
        ]);

      expect(await this.tribalChief.numPools()).to.be.equal(toBN('2'));
      expect(await this.tribalChief.totalAllocPoint()).to.be.equal(toBN('200'));
    });

    it('should be able to get pending sushi and receive multiplier for depositing on force lock pool', async function () {
      const userAddresses = [userAddress];
      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        10,
        300,
        totalStaked,
        pid
      );
    });

    it('should be able to get pending sushi and receive different multipliers for depositing on force lock pool', async function () {
      const userAddresses = [userAddress, secondUserAddress];
      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        [toBN('25000000000000000000'), toBN('75000000000000000000')],
        10,
        [100, 300],
        totalStaked,
        pid
      );
    });

    it('should be able to get pending sushi and receive the same multipliers for depositing on force lock pool', async function () {
      const userAddresses = [userAddress, secondUserAddress];
      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        [toBN('50000000000000000000'), toBN('50000000000000000000')],
        10,
        [100, 100],
        totalStaked,
        pid
      );
    });

    it('should not be able to emergency withdraw from a forced lock pool when a users tokens are locked', async function () {
      const userAddresses = [userAddress];

      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        5,
        100,
        totalStaked,
        pid
      );

      await expectRevert(
        this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress, {}),
        'tokens locked'
      );
    });

    it('should not be able to emergency withdraw from a forced lock pool when the first deposit is unlocked and the other is locked', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        1,
        0,
        '50000000000000000000',
        pid
      );

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        1,
        100,
        '50000000000000000000',
        pid
      );

      await expectRevert(
        this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress, {}),
        'tokens locked'
      );
      // ensure the users still has open deposits
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('2'));
    });

    it('should be able to withdraw a single deposit from a forced lock pool when it becomes unlocked', async function () {
      const userAddresses = [userAddress];

      const depositAmount = '50000000000000000000';
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        1,
        0,
        depositAmount,
        pid
      );

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        1,
        100,
        depositAmount,
        pid
      );
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('2'));

      let userVirtualAmount = (await this.tribalChief.userInfo(pid, userAddress)).virtualAmount;
      // get total deposited amount by adding both deposits together
      let userDepositedAmount = (await this.tribalChief.depositInfo(pid, userAddress, 0)).amount.add(
        (await this.tribalChief.depositInfo(pid, userAddress, 1)).amount
      );

      expect(userDepositedAmount).to.be.equal(toBN(depositAmount).mul(toBN('2')));
      expect(userVirtualAmount).to.be.equal(toBN(depositAmount).mul(toBN('2')));
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN(depositAmount).mul(toBN('2')));

      const startingUserLPTokenBalance = await this.LPToken.balanceOf(userAddress);
      await this.tribalChief
        .connect(impersonatedSigners[userAddress])
        .withdrawFromDeposit(pid, depositAmount, userAddress, 0);
      // get total deposited amount by adding both deposits together
      // first deposit should be empty so userDepositedAmount should total out to depositAmount
      userDepositedAmount = (await this.tribalChief.depositInfo(pid, userAddress, 0)).amount.add(
        (await this.tribalChief.depositInfo(pid, userAddress, 1)).amount
      );
      userVirtualAmount = (await this.tribalChief.userInfo(pid, userAddress)).virtualAmount;
      // verify the users amount deposited went down, the user virtual amount and
      // the virtual total supply went down by 50%
      expect(userVirtualAmount).to.be.equal(toBN(depositAmount));
      expect(userDepositedAmount).to.be.equal(toBN(depositAmount));
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN(depositAmount));

      // verify that user's lp token balance increased by the right amount
      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(
        startingUserLPTokenBalance.add(toBN(depositAmount))
      );

      // ensure the user still has both open deposits as the first one never got closed out
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('2'));
    });

    it('should be able to emergency withdraw from a forced lock pool when the first deposit is unlocked and the other is locked and the pool has been unlocked by the governor', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        1,
        0,
        '50000000000000000000',
        pid
      );

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        1,
        100,
        '50000000000000000000',
        pid
      );

      await expectRevert(
        this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress, {}),
        'tokens locked'
      );
      await this.tribalChief.connect(impersonatedSigners[governorAddress]).unlockPool(pid, {});

      const lpTokenIncrementAmount = '100000000000000000000';
      const startingLPBalance = await this.LPToken.balanceOf(userAddress);
      await this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress, {});
      // user should have no tribe token as they forfeited their rewards
      expect(await this.tribe.balanceOf(userAddress)).to.be.equal(toBN('0'));
      // user should have no reward debt or virtual amount as they forfeited their rewards
      const { virtualAmount, rewardDebt } = await this.tribalChief.userInfo(pid, userAddress);
      expect(rewardDebt).to.be.equal(toBN('0'));
      // multiplier would be oneMultiplier, however, we deleted that storage so that's not the case anymore, now it's just 0
      expect(virtualAmount).to.be.equal(toBN('0'));
      // user should receive their 1e20 LP tokens that they staked back
      expect(await this.LPToken.balanceOf(userAddress)).to.be.equal(
        startingLPBalance.add(toBN(lpTokenIncrementAmount))
      );

      // virtual total supply should now be 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));

      // ensure that all the users deposits got deleted from the system
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('0'));
    });

    it('should not be able to emergency withdraw from a forced lock pool when a users tokens are locked', async function () {
      const userAddresses = [userAddress];

      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        5,
        100,
        totalStaked,
        pid
      );

      await expectRevert(
        this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress, {}),
        'tokens locked'
      );

      // ensure the user still has an open deposit
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('1'));
    });

    it('should be able to emergency withdraw from a forced lock pool when a users tokens are past the unlock block', async function () {
      const userAddresses = [userAddress];

      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        toBN('100000000000000000000'),
        100,
        100,
        totalStaked,
        pid
      );

      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('1'));
      await expect(
        await this.tribalChief.connect(impersonatedSigners[userAddress]).emergencyWithdraw(pid, userAddress, {})
      )
        .to.emit(this.tribalChief, 'EmergencyWithdraw')
        .withArgs(userAddress, toBN(pid.toString()), toBN(totalStaked), userAddress);

      // ensure that the reward debt got zero'd out
      // virtual amount should go to 0
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(rewardDebt).to.be.equal(toBN('0'));
      expect(virtualAmount).to.be.equal(toBN('0'));
      // ensure that the open user deposits got zero'd out and array is 0 length
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.equal(toBN('0'));
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.equal(toBN('0'));
    });
  });
});
