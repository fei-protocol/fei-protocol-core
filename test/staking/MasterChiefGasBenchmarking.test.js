/* eslint-disable no-param-reassign */
/* eslint-disable no-undef */
/* eslint-disable no-unused-expressions */
/* eslint-disable no-plusplus */
/* eslint-disable no-await-in-loop */
const { time } = require('@openzeppelin/test-helpers');
const {
  BN,
  expectEvent,
  expectRevert,
  expect,
  getCore,
  getAddresses,
  expectApprox,
} = require('../helpers');

const Tribe = artifacts.require('MockTribe');
const MockCoreRef = artifacts.require('MockCoreRef');
const MasterChief = artifacts.require('MasterChief');
const MockERC20 = artifacts.require('MockERC20');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function testMultipleUsersPooling(
  masterChief,
  lpToken,
  userAddresses,
  incrementAmount,
  blocksToAdvance,
  lockLength,
  totalStaked,
  pid,
) {
  // if lock length isn't defined, it defaults to 0
  lockLength = lockLength === undefined ? 0 : lockLength;

  // approval loop
  for (let i = 0; i < userAddresses.length; i++) {
    if ((await lpToken.allowance(userAddresses[i], masterChief.address)).lt(new BN(totalStaked))) {
      await lpToken.approve(masterChief.address, totalStaked, { from: userAddresses[i] });
    }
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

    await masterChief.deposit(
      pid,
      totalStaked,
      lockBlockAmount,
      { from: userAddresses[i] },
    );
  }

  const pendingBalances = [];
  for (let i = 0; i < userAddresses.length; i++) {
    const balance = new BN(await masterChief.allPendingRewards(pid, userAddresses[i]));
    pendingBalances.push(balance);
  }

  for (let i = 0; i < blocksToAdvance; i++) {
    for (let j = 0; j < pendingBalances.length; j++) {
      pendingBalances[j] = new BN(await masterChief.allPendingRewards(pid, userAddresses[j]));
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

      expectApprox(
        pendingBalances[j].add(userIncrementAmount),
        new BN(await masterChief.allPendingRewards(pid, userAddresses[j])),
      );
    }
  }
}

const emergencyWithdrawReport = [];
const withdrawAllAndHarvestReport = [];
const withdrawFromDepositReport = [];
const harvestReport = [];
const depositReport = [];

describe('MasterChief', () => {
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

  // rewards multiplier by 20%
  const multiplier20 = new BN('1200000000000000000');
  const zeroMultiplier = '1000000000000000000';
  const defaultRewardsObject = [
    {
      lockLength: 0,
      rewardMultiplier: zeroMultiplier,
    },
  ];

  // allocation points we will use to initialize a pool with
  const allocationPoints = 100;
  // this is the amount of LP tokens that we will mint to users
  // This is also the amount of LP tokens that will be staked into the MasterChief contract
  const totalStaked = '100000000000000000000';
  // this is the amount of tribe we will mint to the MasterChief contract
  const mintAmount = new BN('1000000000000000000000000000000000000000000000');

  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      beneficiaryAddress1,
      beneficiaryAddress2,
      minterAddress,
      burnerAddress,
      pcvControllerAddress,
      governorAddress,
      genesisGroup,
      guardianAddress,
    } = await getAddresses());

    thirdUserAddress = beneficiaryAddress1;
    fourthUserAddress = minterAddress;
    fifthUserAddress = burnerAddress;
    sixthUserAddress = pcvControllerAddress;
    seventhUserAddress = governorAddress;
    eigthUserAddress = genesisGroup;
    ninthUserAddress = guardianAddress;
    tenthUserAddress = beneficiaryAddress2;

    this.core = await getCore(false);

    this.tribe = await Tribe.new();
    this.coreRef = await MockCoreRef.new(this.core.address);

    this.masterChief = await MasterChief.new(this.core.address, this.tribe.address);

    // create and mint LP tokens
    this.curveLPToken = await MockERC20.new();
    await this.curveLPToken.mint(userAddress, totalStaked);
    await this.curveLPToken.mint(secondUserAddress, totalStaked);

    this.LPToken = await MockERC20.new();
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

    // mint tribe tokens to the masterchief contract to distribute as rewards
    await this.tribe.mint(this.masterChief.address, mintAmount, { from: minterAddress });

    // create new reward stream
    const tx = await this.masterChief.add(
      allocationPoints,
      this.LPToken.address,
      ZERO_ADDRESS,
      defaultRewardsObject.concat(
        [
          {
            lockLength: 100,
            rewardMultiplier: '1100000000000000000',
          },
        ],
      ),
      { from: governorAddress },
    );
    // grab PID from the logs
    pid = Number(tx.logs[0].args.pid);
    // grab the per block reward by calling the masterchief contract
    perBlockReward = Number(await this.masterChief.tribePerBlock());
  });

  describe('Test Staking', () => {
    it('should be able to stake LP Tokens', async function () {
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));
      await this.LPToken.approve(this.masterChief.address, totalStaked);
      const tx = await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });
      const obj = {
        gas: tx.receipt.gasUsed,
        msg: 'gas used for the first deposit',
      };
      depositReport.push(obj);
    });
  });

  describe('Test Withdraw and Harvest Scenarios', () => {
    it('should be able to distribute sushi after 10 blocks with 3 users staking by withdrawing and then harvesting with 2 PIDs', async function () {
      const userAddresses = [
        userAddress,
        secondUserAddress,
        thirdUserAddress,
      ];

      expect(Number(await this.masterChief.poolLength())).to.be.equal(1);

      await testMultipleUsersPooling(
        this.masterChief,
        this.LPToken,
        userAddresses,
        new BN('33333333333300000000'),
        10,
        0,
        totalStaked,
        pid,
      );

      for (let i = 0; i < userAddresses.length; i++) {
        const address = userAddresses[i];

        expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN('0'));
        expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

        // subtract 1 from the amount of deposits
        const pendingTribeBeforeHarvest = await this.masterChief.allPendingRewards(pid, address);

        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        const tx = await this.masterChief.withdrawFromDeposit(
          pid, totalStaked, address, index, { from: address },
        );
        const obj = {
          gas: tx.receipt.gasUsed,
          msg: `user ${i} withdraws from deposit`,
        };
        withdrawFromDepositReport.push(obj);
        // console.log('withdrawFromDeposit tx: ', tx.receipt.gasUsed);

        expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN(totalStaked));
        expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

        const pendingTribe = await this.masterChief.allPendingRewards(pid, address);
        expect(pendingTribe).to.be.bignumber.gt(pendingTribeBeforeHarvest);

        const harvestTx = await this.masterChief.harvest(pid, address, { from: address });
        // console.log('harvest tx gasUsed: ', harvestTx.receipt.gasUsed);
        harvestReport.push({
          gas: harvestTx.receipt.gasUsed,
          msg: `user ${i} harvests`,
        });
        const tribeBalance = await this.tribe.balanceOf(address);
        expect(tribeBalance).to.be.bignumber.gte(pendingTribe);
      }
    });

    // do a withdraw all here and check gas expenditure
    it('allPendingRewards should be able to get all rewards data across multiple deposits in a single pool', async function () {
      const userAddresses = [
        userAddress,
        userAddress,
      ];

      await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
      await this.LPToken.approve(this.masterChief.address, '200000000000000000000');

      const incrementAmount = new BN(totalStaked);

      await testMultipleUsersPooling(
        this.masterChief,
        this.LPToken,
        userAddresses,
        incrementAmount,
        1,
        0,
        totalStaked,
        pid,
      );

      const tx = await this.masterChief.withdrawAllAndHarvest(
        pid, userAddress, { from: userAddress },
      );
      const obj = {
        gas: tx.receipt.gasUsed,
        msg: 'gas used withdrawing all and harvesting with 2 deposits',
      };
      withdrawAllAndHarvestReport.push(obj);

    //   console.log('withdrawAllAndHarvest tx: ', tx.receipt.gasUsed);
    });

    it('harvest should be able to claim all rewards from multiple deposits in a single pool', async function () {
      const userAddresses = [
        userAddress,
        userAddress,
        secondUserAddress,
      ];

      await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
      await this.LPToken.approve(this.masterChief.address, '200000000000000000000');

      const incrementAmount = [
        new BN('66666666666600000000'), // user one should receive 2/3 of block rewards
        new BN('66666666666600000000'),
        new BN('33333333333300000000'), // user two should receive 1/3 of block rewards
      ];

      await testMultipleUsersPooling(
        this.masterChief,
        this.LPToken,
        userAddresses,
        incrementAmount,
        1,
        0,
        totalStaked,
        pid,
      );

      const startingTribe = await this.tribe.balanceOf(userAddress);
      expect(startingTribe).to.be.bignumber.equal(new BN('0'));

      const tx = await this.masterChief.withdrawAllAndHarvest(
        pid, userAddress, { from: userAddress },
      );
      const obj = {
        gas: tx.receipt.gasUsed,
        msg: 'gas used withdrawing all and harvesting with 2 deposits',
      };
      withdrawAllAndHarvestReport.push(obj);

      //   console.log('withdrawAllAndHarvest tx gasUsed for 2 deposit withdraw and harvest: ', tx.receipt.gasUsed);
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('200000000000000000000'));
    });

    it('harvest should be able to claim all rewards from 10 deposits in a single pool as a single user', async function () {
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
        userAddress,
      ];

      await this.LPToken.mint(userAddress, '1000000000000000000000'); // approve double total staked
      await this.LPToken.approve(this.masterChief.address, '1000000000000000000000', { from: userAddress });

      const incrementAmount = new BN('100000000000000000000');
      await testMultipleUsersPooling(
        this.masterChief,
        this.LPToken,
        userAddresses,
        incrementAmount,
        1,
        0,
        totalStaked,
        pid,
      );

      const startingTribe = await this.tribe.balanceOf(userAddress);
      expect(startingTribe).to.be.bignumber.equal(new BN('0'));

      const tx = await this.masterChief.withdrawAllAndHarvest(
        pid, userAddress, { from: userAddress },
      );
      const obj = {
        gas: tx.receipt.gasUsed,
        msg: 'gas used withdrawing all and harvesting with 10 deposits',
      };
      withdrawAllAndHarvestReport.push(obj);

      //   console.log('withdrawAllAndHarvest tx gasUsed for 10 deposit withdraw and harvest: ', tx.receipt.gasUsed);
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('1100000000000000000000'));
    });

    it('harvest should be able to claim all rewards from 20 deposits in a single pool as a single user', async function () {
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
        userAddress,
        userAddress,
        userAddress,
        userAddress,
        userAddress,
        userAddress,
        userAddress,
        userAddress,
        userAddress,
        userAddress,
        userAddress,
      ];

      await this.LPToken.mint(userAddress, '2000000000000000000000'); // approve double total staked
      await this.LPToken.approve(this.masterChief.address, '2000000000000000000000', { from: userAddress });

      const incrementAmount = new BN('100000000000000000000');
      await testMultipleUsersPooling(
        this.masterChief,
        this.LPToken,
        userAddresses,
        incrementAmount,
        1,
        0,
        totalStaked,
        pid,
      );

      const startingTribe = await this.tribe.balanceOf(userAddress);
      expect(startingTribe).to.be.bignumber.equal(new BN('0'));

      const tx = await this.masterChief.withdrawAllAndHarvest(
        pid, userAddress, { from: userAddress },
      );
      const obj = {
        gas: tx.receipt.gasUsed,
        msg: 'gas used withdrawing all and harvesting with 20 deposits',
      };
      withdrawAllAndHarvestReport.push(obj);

      //   console.log('withdrawAllAndHarvest tx gasUsed for 20 deposit withdraw and harvest: ', tx.receipt.gasUsed);
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('2100000000000000000000'));
    });
  });

  describe('Test Pool with Force Lockup', () => {
    beforeEach(async function () {
      this.multiplier = multiplier20;
      expect(await this.masterChief.totalAllocPoint()).to.be.bignumber.equal(new BN('100'));

      // create new reward stream
      const tx = await this.masterChief.add(
        allocationPoints,
        this.LPToken.address,
        ZERO_ADDRESS,
        [
          {
            lockLength: 100,
            rewardMultiplier: zeroMultiplier,
          },
          {
            lockLength: 0,
            rewardMultiplier: zeroMultiplier,
          },
          {
            lockLength: 300,
            rewardMultiplier: (new BN(zeroMultiplier)).mul(new BN('3')).toString(),
          },
        ],
        { from: governorAddress },
      );
      // grab PID from the logs
      pid = Number(tx.logs[0].args.pid);
      expect(await this.masterChief.totalAllocPoint()).to.be.bignumber.equal(new BN('200'));
      expect(await this.masterChief.poolLength()).to.be.bignumber.equal(new BN('2'));

      // set allocation points of earlier pool to 0 so that
      // full block rewards are given out to this pool
      await this.masterChief.set(0, 0, ZERO_ADDRESS, false, { from: governorAddress });
      expect(await this.masterChief.totalAllocPoint()).to.be.bignumber.equal(new BN('100'));

      expect(
        (await this.masterChief.poolInfo(0)).allocPoint,
      ).to.be.bignumber.equal(new BN('0'));
      expect(
        (await this.masterChief.poolInfo(1)).allocPoint,
      ).to.be.bignumber.equal(new BN(allocationPoints.toString()));
    });

    it('should be able to emergency withdraw from a forced lock pool when a users tokens are past the unlock block', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.masterChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        100,
        100,
        totalStaked,
        pid,
      );

      const tx = await this.masterChief.emergencyWithdraw(pid, userAddress, { from: userAddress });
      const obj = {
        gas: tx.receipt.gasUsed,
        msg: 'gas used doing an emergency withdraw with 1 deposit',
      };
      emergencyWithdrawReport.push(obj);

      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));

      // ensure that the reward debt got zero'd out
      // virtual amount should go to 0
      expect((await this.masterChief.userInfo(pid, userAddress)).rewardDebt).to.be.bignumber.equal(new BN('0'));
      expect((await this.masterChief.userInfo(pid, userAddress)).virtualAmount).to.be.bignumber.equal(new BN('0'));
      // ensure that the open user deposits got zero'd out and array is 0 length
      expect(await this.masterChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('0'));
    });

    it('should be able to emergency withdraw from a forced lock pool when a users tokens are past the unlock block with 2 deposits', async function () {
      const userAddresses = [userAddress];

      await this.LPToken.approve(this.masterChief.address, '100000000000000000000000000000000000');
      for (let i = 1; i < 20; i++) {
        await testMultipleUsersPooling(
          this.masterChief,
          this.LPToken,
          userAddresses,
          new BN('100000000000000000000'),
          0,
          0,
          totalStaked,
          pid,
        );

        const tx = await this.masterChief.emergencyWithdraw(
          pid, userAddress, { from: userAddress },
        );
        const obj = {
          gas: tx.receipt.gasUsed,
          msg: `gas used doing an emergency withdraw with ${i} deposits`,
        };
        emergencyWithdrawReport.push(obj);
        userAddresses.push(userAddress);

        expect(
          await this.LPToken.balanceOf(userAddress),
        ).to.be.bignumber.equal((new BN(totalStaked)).mul(new BN(i.toString())));

        // ensure that the reward debt got zero'd out
        // virtual amount should go to 0
        const { rewardDebt, virtualAmount } = await this.masterChief.userInfo(pid, userAddress);
        expect(rewardDebt).to.be.bignumber.equal(new BN('0'));
        expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
        // ensure that the open user deposits got zero'd out and array is 0 length
        expect(await this.masterChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('0'));
        // ensure that the virtual total supply got zero'd as well
        expect((await this.masterChief.poolInfo(pid)).virtualPoolTotalSupply).to.be.bignumber.equal(new BN('0'));

        await this.LPToken.mint(
          userAddress,
          totalStaked,
        );
      }
    });
  });

  describe('Test Rewards Multiplier', () => {
    beforeEach(async function () {
      this.multiplier = multiplier20;
      this.lockLength = 100;
      // create new reward stream
      const tx = await this.masterChief.add(
        allocationPoints,
        this.LPToken.address,
        ZERO_ADDRESS,
        [
          {
            lockLength: 100,
            rewardMultiplier: zeroMultiplier,
          },
          {
            lockLength: 300,
            rewardMultiplier: (new BN(zeroMultiplier)).mul(new BN('3')).toString(),
          },
        ],
        { from: governorAddress },
      );
      // grab PID from the logs
      pid = Number(tx.logs[0].args.pid);

      // set allocation points of earlier pool to 0 so that
      // full block rewards are given out to this pool
      await this.masterChief.set(0, 0, ZERO_ADDRESS, false, { from: governorAddress });
    });

    it('should not be able to withdraw principle before locking period is over by calling withdrawAllAndHarvest', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.masterChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid,
      );

      const pendingTribe = await this.masterChief.allPendingRewards(pid, userAddress);
      const tx = await this.masterChief.withdrawAllAndHarvest(
        pid, userAddress, { from: userAddress },
      );
      const obj = {
        gas: tx.receipt.gasUsed,
        msg: 'gas used withdrawing all and harvesting when tokens are locked and only harvesting with 1 deposit',
      };
      withdrawAllAndHarvestReport.push(obj);

      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.gte(pendingTribe);
    });

    it('', async () => {
      function printData(data, message) {
        console.log(message);
        data.forEach((e) => { console.log(`${e.msg} ${e.gas}`); });
      }
      printData(emergencyWithdrawReport, '\n\n\n~~~~~~~~~~~~ Emergency Withdraw Report ~~~~~~~~~~~~\n');
      printData(withdrawAllAndHarvestReport, '\n\n\n~~~~~~~~~~~~ Withdaw All And Harvest Report ~~~~~~~~~~~~\n');
      printData(withdrawFromDepositReport, '\n\n\n~~~~~~~~~~~~ Withdaw From Deposit Report ~~~~~~~~~~~~\n');
      printData(harvestReport, '\n\n\n~~~~~~~~~~~~ Harvest Report ~~~~~~~~~~~~\n');
      printData(depositReport, '\n\n\n~~~~~~~~~~~~ Deposit Report ~~~~~~~~~~~~\n');
    });
  });
});
