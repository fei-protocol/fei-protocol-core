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
const TribalChief = artifacts.require('TribalChief');
const MockERC20 = artifacts.require('MockERC20');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

async function testMultipleUsersPooling(
  tribalChief,
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
    if ((await lpToken.allowance(userAddresses[i], tribalChief.address)).lt(new BN(totalStaked))) {
      await lpToken.approve(tribalChief.address, totalStaked, { from: userAddresses[i] });
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

    const currentIndex = await tribalChief.openUserDeposits(pid, userAddresses[i]);
    expectEvent(
      await tribalChief.deposit(
        pid,
        totalStaked,
        lockBlockAmount,
        { from: userAddresses[i] },
      ),
      'Deposit', {
        user: userAddresses[i],
        pid: new BN(pid.toString()),
        amount: new BN(totalStaked),
        depositID: currentIndex,
      },
    );
  }

  const pendingBalances = [];
  for (let i = 0; i < userAddresses.length; i++) {
    const balance = new BN(await tribalChief.allPendingRewards(pid, userAddresses[i]));
    pendingBalances.push(balance);
  }

  for (let i = 0; i < blocksToAdvance; i++) {
    for (let j = 0; j < pendingBalances.length; j++) {
      pendingBalances[j] = new BN(await tribalChief.allPendingRewards(pid, userAddresses[j]));
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
        new BN(await tribalChief.allPendingRewards(pid, userAddresses[j])),
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
  // This is also the amount of LP tokens that will be staked into the tribalChief contract
  const totalStaked = '100000000000000000000';
  // this is the amount of tribe we will mint to the tribalChief contract
  const mintAmount = new BN('1000000000000000000000000000000000000000000000');

  before(async () => {
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
  });

  describe('first suite', () => {
    beforeEach(async function () {
      this.core = await getCore(false);

      this.tribe = await Tribe.new();
      this.coreRef = await MockCoreRef.new(this.core.address);

      this.tribalChief = await TribalChief.new(this.core.address, this.tribe.address);

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

      // mint tribe tokens to the tribalChief contract to distribute as rewards
      await this.tribe.mint(this.tribalChief.address, mintAmount, { from: minterAddress });

      // create new reward stream
      const tx = await this.tribalChief.add(
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
      // grab the per block reward by calling the tribalChief contract
      perBlockReward = Number(await this.tribalChief.tribePerBlock());
    });

    describe('Test Security', () => {
      it('should not be able to add rewards stream as non governor', async function () {
        await expectRevert(
          this.tribalChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            defaultRewardsObject,
            { from: userAddress },
          ),
          'CoreRef: Caller is not a governor',
        );
      });

      it('should not be able to add rewards stream with 0 allocation points', async function () {
        await expectRevert(
          this.tribalChief.add(
            0,
            this.LPToken.address,
            ZERO_ADDRESS,
            defaultRewardsObject,
            { from: governorAddress },
          ),
          'pool must have allocation points to be created',
        );
      });

      it('should not be able to unlockPool as non governor', async function () {
        await expectRevert(
          this.tribalChief.unlockPool(
            pid,
            { from: userAddress },
          ),
          'CoreRef: Caller is not a governor',
        );
      });

      it('should be able to unlockPool as governor', async function () {
        await this.tribalChief.unlockPool(
          pid,
          { from: governorAddress },
        );
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.true;
      });

      it('should be able to lockPool as governor', async function () {
        await this.tribalChief.lockPool(
          pid,
          { from: governorAddress },
        );
        expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.false;
      });

      it('should not be able to lockPool as non governor', async function () {
        await expectRevert(
          this.tribalChief.lockPool(
            pid,
            { from: userAddress },
          ),
          'CoreRef: Caller is not a governor',
        );
      });

      it('should not be able to change rewards multiplier as non governor', async function () {
        await expectRevert(
          this.tribalChief.governorAddPoolMultiplier(pid, 0, 0, { from: userAddress }),
          'CoreRef: Caller is not a governor',
        );
      });

      it('governor should be able to add rewards stream', async function () {
        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
        await this.tribalChief.add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );
        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);
        expect(
          (await this.tribalChief.poolInfo(1)).allocPoint,
        ).to.be.bignumber.equal(new BN(allocationPoints));
      });

      it('should not be able to set rewards stream as non governor', async function () {
        await expectRevert(
          this.tribalChief.set(
            0,
            allocationPoints,
            this.LPToken.address,
            true,
            { from: userAddress },
          ),
          'CoreRef: Caller is not a governor',
        );
      });

      it('should not be able to set rewards stream to 0 allocation points', async function () {
        await expectRevert(
          this.tribalChief.set(
            0,
            0,
            this.LPToken.address,
            true,
            { from: governorAddress },
          ),
          '0 allocation points for pool not allowed',
        );
      });

      it('governor should be able to set rewards stream with new amount of allocation points', async function () {
        const newAllocationPoints = 10;
        await this.tribalChief.set(
          0,
          newAllocationPoints,
          this.LPToken.address,
          true,
          { from: governorAddress },
        );
        expect(
          (await this.tribalChief.poolInfo(pid)).allocPoint,
        ).to.be.bignumber.equal(new BN(newAllocationPoints));
      });

      it('should not be able to governorWithdrawTribe as non governor', async function () {
        await expectRevert(
          this.tribalChief.governorWithdrawTribe('100000000', { from: userAddress }),
          'CoreRef: Caller is not a governor',
        );
      });

      it('should be able to governorWithdrawTribe as governor', async function () {
        const withdrawAmount = await this.tribe.balanceOf(this.tribalChief.address);
        expect(withdrawAmount).to.be.bignumber.equal(mintAmount);
        expectEvent(
          await this.tribalChief.governorWithdrawTribe(withdrawAmount, { from: governorAddress }),
          'TribeWithdraw',
          {
            amount: withdrawAmount,
          },
        );

        const coreBalance = await this.tribe.balanceOf(this.core.address);
        expect(coreBalance).to.be.bignumber.equal(mintAmount);

        const afterTribalChiefBalance = await this.tribe.balanceOf(this.tribalChief.address);
        expect(afterTribalChiefBalance).to.be.bignumber.equal(new BN('0'));
      });

      it('should not be able to updateBlockReward as non governor', async function () {
        await expectRevert(
          this.tribalChief.updateBlockReward('100000000', { from: userAddress }),
          'CoreRef: Caller is not a governor',
        );
      });

      it('governor should be able to updateBlockReward', async function () {
        const newBlockRewards = [
          1000000000,
          2000000000,
          3000000000,
          4000000000,
          5000000000,
          6000000000,
        ];

        expect(await this.tribalChief.tribePerBlock()).to.be.bignumber.equal(new BN('100000000000000000000'));
        for (let i = 0; i < newBlockRewards.length; i++) {
        // update the block reward
          expectEvent(
            await this.tribalChief.updateBlockReward(newBlockRewards[i], { from: governorAddress }),
            'NewTribePerBlock', {
              amount: new BN(newBlockRewards[i].toString()),
            },
          );

          // assert this new block reward is in place
          expect(
            await this.tribalChief.tribePerBlock(),
          ).to.be.bignumber.equal(new BN(newBlockRewards[i]));
        }
      });

      it('governor should be able to pause the TribalChief', async function () {
        expect(await this.tribalChief.paused()).to.be.false;
        expectEvent(
          await this.tribalChief.pause({ from: governorAddress }),
          'Paused',
          {
            account: governorAddress,
          },
        );
        expect(await this.tribalChief.paused()).to.be.true;
      });

      it('user should not be able to deposit when the TribalChief is paused', async function () {
        expect(await this.tribalChief.paused()).to.be.false;
        expectEvent(
          await this.tribalChief.pause({ from: governorAddress }),
          'Paused',
          {
            account: governorAddress,
          },
        );
        expect(await this.tribalChief.paused()).to.be.true;

        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await expectRevert(
          this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress }),
          'Pausable: paused',
        );
      });
    });

    describe('Test Staking', () => {
      it('should be able to stake LP Tokens', async function () {
        expect(
          await this.LPToken.balanceOf(userAddress),
        ).to.be.bignumber.equal(new BN(totalStaked));

        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        expectEvent(
          await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress }),
          'Deposit', {
            user: userAddress,
            pid: new BN(pid.toString()),
            amount: new BN(totalStaked),
            depositID: new BN('0'),
          },
        );
        expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));

        // grab the index by getting the amount of deposit they have and subtracting 1
        const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        // assert user has received their balance in
        // the tribalChief contract registered under their account
        expect(
          (await this.tribalChief.depositInfo(pid, userAddress, index)).amount,
        ).to.be.bignumber.equal(new BN(totalStaked));
      });

      it('should be able to get pending sushi', async function () {
        const userAddresses = [userAddress];

        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('100000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );
      });

      it('should be able to get pending sushi', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await this.tribalChief.allPendingRewards(pid, userAddress)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);
      });

      it('should be able to get pending sushi after one block with a single pool and user staking', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked);
        await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress });

        await time.advanceBlock();

        expect(
          Number(await this.tribalChief.allPendingRewards(pid, userAddress)),
        ).to.be.equal(perBlockReward);
      });

      it('should be able to step down rewards by creating a new PID for curve with equal allocation points after 10 blocks, then go another 10 blocks', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked, { from: userAddress });
        await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await this.tribalChief.allPendingRewards(pid, userAddress)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });

        // add on one to the advance block amount as we have advanced
        // one more block when calling the harvest function
        expect(
          Number(await this.tribe.balanceOf(userAddress)),
        ).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        // adding another PID for curve will cut user rewards
        // in half for users staked in the first pool
        const addTx = await this.tribalChief.add(
          allocationPoints,
          this.curveLPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );

        const pid2 = Number(addTx.logs[0].args.pid);
        await this.curveLPToken.approve(
          this.tribalChief.address,
          totalStaked,
          { from: secondUserAddress },
        );
        await this.tribalChief.deposit(pid2, totalStaked, 0, { from: secondUserAddress });

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // we did 5 tx's before starting and then do 1 tx to harvest so start with i at 3.
        for (let i = 5; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });

        // for 7 blocks, we received half of the rewards of one pool.
        // For one block after the 10 blocks, we received 100% of all block rewards
        expect(
          await this.tribe.balanceOf(userAddress),
        ).to.be.bignumber.equal(
          new BN((((perBlockReward / 2) * (advanceBlockAmount - 3)) + (perBlockReward)).toString())
            .add(startingTribeBalance),
        );

        await this.tribalChief.harvest(pid2, secondUserAddress, { from: secondUserAddress });

        // subtract 2 from the advance block amount as we have advanced
        // two less blocks when calling the harvest function
        expect(
          Number(await this.tribe.balanceOf(secondUserAddress)),
        ).to.be.equal((perBlockReward / 2) * (advanceBlockAmount - 3));
      });

      // this test will test what happens when we update the block
      // reward after a user has already accrued rewards
      it('should be able to step down rewards by halving rewards per block after 10 blocks, then go another 10 blocks', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked, { from: userAddress });
        await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await this.tribalChief.allPendingRewards(pid, userAddress)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });

        // add on one to the advance block amount as we have
        // advanced one more block when calling the harvest function
        expect(
          Number(await this.tribe.balanceOf(userAddress)),
        ).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        await this.tribalChief.updateBlockReward('50000000000000000000', { from: governorAddress });

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // we did 3 tx's before starting so start with i at 3.
        for (let i = 3; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        const expectedAmount = startingTribeBalance
          .add(new BN(((perBlockReward / 2) * (advanceBlockAmount - 1)).toString()));
        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(expectedAmount);
      });

      it('should be able to step down rewards by creating a new PID with equal allocation points after 10 blocks, then go another 5 blocks', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked, { from: userAddress });
        await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await this.tribalChief.allPendingRewards(pid, userAddress)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });

        // add on one to the advance block amount as we have advanced
        // one more block when calling the harvest function
        expect(
          Number(await this.tribe.balanceOf(userAddress)),
        ).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // adding another PID will cut user rewards in half for users staked in the first pool
        await this.tribalChief.add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );

        // we did 2 tx's before starting so start with i at 2.
        for (let i = 2; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });
        const endingTribeBalance = await this.tribe.balanceOf(userAddress);
        const rewardAmount = endingTribeBalance.sub(startingTribeBalance);

        expect(rewardAmount).to.be.bignumber.equal(
          new BN(((perBlockReward / 2) * advanceBlockAmount).toString()),
        );
      });

      it('should be able to get pending sushi after 10 blocks', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked, { from: userAddress });
        await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        expect(
          Number(await this.tribalChief.allPendingRewards(pid, userAddress)),
        ).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });
        // add on one to the advance block amount as we have
        // advanced one more block when calling the harvest function
        expect(
          Number(await this.tribe.balanceOf(userAddress)),
        ).to.be.equal(perBlockReward * (advanceBlockAmount + 1));
      });

      it('should be able to get pending sushi 10 blocks with 2 users staking', async function () {
        await this.LPToken.approve(this.tribalChief.address, totalStaked, { from: userAddress });
        await this.LPToken.approve(
          this.tribalChief.address, totalStaked, { from: secondUserAddress },
        );

        await this.tribalChief.deposit(pid, totalStaked, 0, { from: userAddress });
        await this.tribalChief.deposit(pid, totalStaked, 0, { from: secondUserAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
          await time.advanceBlock();
        }

        // validate that the balance of the user is correct before harvesting rewards
        expect(
          Number(await this.tribalChief.allPendingRewards(pid, userAddress)),
        ).to.be.equal(((perBlockReward * advanceBlockAmount) / 2) + perBlockReward);
        expect(
          Number(await this.tribalChief.allPendingRewards(pid, secondUserAddress)),
        ).to.be.equal(((perBlockReward * advanceBlockAmount) / 2));

        await this.tribalChief.harvest(pid, secondUserAddress, { from: secondUserAddress });
        // add on one to the advance block amount as we have advanced
        // one more block when calling the harvest function
        expect(
          Number(await this.tribe.balanceOf(secondUserAddress)),
        ).to.be.equal(((perBlockReward * (advanceBlockAmount + 1)) / 2));

        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });
        // add on two to the advance block amount as we have advanced two
        // more blocks before calling the harvest function
        expect(
          Number(await this.tribe.balanceOf(userAddress)),
        ).to.be.equal(((perBlockReward * advanceBlockAmount) / 2) + perBlockReward * 2);
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function', async function () {
        const userAddresses = [
          userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress, fifthUserAddress,
        ];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('20000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );
      });

      it('should be able to distribute sushi after 10 blocks with 4 users staking using helper function', async function () {
        const userAddresses = [userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('25000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );
      });

      it('should be able to distribute sushi after 10 blocks with 2 users staking using helper function', async function () {
        const userAddresses = [userAddress, secondUserAddress];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('50000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );
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
          tenthUserAddress,
        ];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );
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
          tenthUserAddress,
        ];

        await this.tribalChief.add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );

        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('5000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );
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
          tenthUserAddress,
        ];

        await this.tribalChief.add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );
        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('5000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );
        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddresses[i]);
          await this.tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await this.LPToken.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked));
          expect(
            await this.tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 2 staking PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
          fifthUserAddress,
        ];

        await this.tribalChief.add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );
        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddresses[i]);
          await this.tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await this.LPToken.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked));
          expect(
            await this.tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 1 staking PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
          fifthUserAddress,
        ];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('20000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddresses[i]);
          await this.tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await this.LPToken.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 2 users staking using helper function and 5 staking PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
        ];

        // only add 4 pools as the before each hook always adds 1 pool
        for (let i = 1; i < 5; i++) {
          await this.tribalChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            defaultRewardsObject,
            { from: governorAddress },
          );
          expect(Number(await this.tribalChief.numPools())).to.be.equal(1 + i);
        }
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
          new BN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddresses[i]);
          await this.tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await this.LPToken.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked));
          expect(
            await this.tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 4 users staking using helper function and 1 staking PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
        ];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('25000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddresses[i]);
          await this.tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await this.LPToken.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked));
          expect(
            await this.tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 2 staking PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
          fourthUserAddress,
          fifthUserAddress,
        ];

        await this.tribalChief.add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );
        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('10000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
          expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddresses[i]);
          await this.tribalChief.withdrawAllAndHarvest(
            pid, userAddresses[i], { from: userAddresses[i] },
          );

          expect(
            await this.LPToken.balanceOf(userAddresses[i]),
          ).to.be.bignumber.equal(new BN(totalStaked));
          expect(
            await this.tribe.balanceOf(userAddresses[i]),
          ).to.be.bignumber.gt(pendingTribe);
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
          tenthUserAddress,
        ];

        await this.tribalChief.add(
          allocationPoints,
          this.LPToken.address,
          ZERO_ADDRESS,
          defaultRewardsObject,
          { from: governorAddress },
        );

        expect(Number(await this.tribalChief.numPools())).to.be.equal(2);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('5000000000000000000'),
          10,
          0,
          totalStaked,
          pid,
        );

        for (let i = 0; i < userAddresses.length; i++) {
          const address = userAddresses[i];

          expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN('0'));
          expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

          const pendingTribeBeforeHarvest = await this.tribalChief.allPendingRewards(pid, address);

          const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
          await this.tribalChief.withdrawFromDeposit(
            pid, totalStaked, address, index, { from: address },
          );

          expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN(totalStaked));
          expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

          // assert that reward debt went negative after we withdrew
          // all of our principle without harvesting
          expect((await this.tribalChief.userInfo(pid, address)).rewardDebt).to.be.bignumber.lt(new BN('-1'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, address);
          expect(pendingTribe).to.be.bignumber.gt(pendingTribeBeforeHarvest);

          await this.tribalChief.harvest(pid, address, { from: address });
          const tribeBalance = await this.tribe.balanceOf(address);
          expect(tribeBalance).to.be.bignumber.gte(pendingTribe);
        }
      });

      it('should be able to distribute sushi after 10 blocks with 3 users staking by withdrawing and then harvesting with 2 PIDs', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
        ];

        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);

        await testMultipleUsersPooling(
          this.tribalChief,
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
          const pendingTribeBeforeHarvest = await this.tribalChief.allPendingRewards(pid, address);

          const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
          await this.tribalChief.withdrawFromDeposit(
            pid, totalStaked, address, index, { from: address },
          );

          expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN(totalStaked));
          expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, address);
          expect(pendingTribe).to.be.bignumber.gt(pendingTribeBeforeHarvest);

          await this.tribalChief.harvest(pid, address, { from: address });
          const tribeBalance = await this.tribe.balanceOf(address);
          expect(tribeBalance).to.be.bignumber.gte(pendingTribe);
        }
      });

      it('allPendingRewards should be able to get all rewards data across multiple deposits in a single pool', async function () {
        const userAddresses = [
          userAddress,
          userAddress,
        ];

        await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
        await this.LPToken.approve(this.tribalChief.address, '200000000000000000000');

        const incrementAmount = new BN(totalStaked);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          incrementAmount,
          1,
          0,
          totalStaked,
          pid,
        );

        await this.tribalChief.harvest(pid, userAddress);
        // should get per block reward 3x.
        // 1 block to do 2nd deposit,
        // 1 block to advance,
        // 1 block for the harvest
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN('300000000000000000000'));
      });

      it('allPendingRewards should be able to get all rewards data across a single deposit in a pool', async function () {
        const userAddresses = [userAddress];

        const incrementAmount = new BN(totalStaked);

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          incrementAmount,
          2,
          0,
          totalStaked,
          pid,
        );

        await this.tribalChief.harvest(pid, userAddress);
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(new BN('300000000000000000000'));
      });

      it('harvest should be able to claim all rewards from multiple deposits in a single pool', async function () {
        const userAddresses = [
          userAddress,
          userAddress,
          secondUserAddress,
        ];

        await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
        await this.LPToken.approve(this.tribalChief.address, '200000000000000000000');

        const incrementAmount = [
          new BN('66666666666600000000'), // user one should receive 2/3 of block rewards
          new BN('66666666666600000000'),
          new BN('33333333333300000000'), // user two should receive 1/3 of block rewards
        ];

        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          incrementAmount,
          1,
          0,
          totalStaked,
          pid,
        );
        // users pending rewards for both deposits should be 2x increment amount
        // user got 2 blocks of full rewards so subtract block reward x 2 from their balance

        // grab all deposits and withdraw them without harvesting rewards
        const depositAmounts = Number(await this.tribalChief.openUserDeposits(pid, userAddress));
        for (let i = 0; i < depositAmounts; i++) {
          const startingLP = await this.LPToken.balanceOf(userAddress);
          await this.tribalChief.withdrawFromDeposit(
            pid, totalStaked, userAddress, i, { from: userAddress },
          );
          const endingLP = await this.LPToken.balanceOf(userAddress);

          // ensure the users LPToken balance increased
          expect(startingLP.add(new BN(totalStaked))).to.be.bignumber.equal(endingLP);
        }

        const startingTribe = await this.tribe.balanceOf(userAddress);
        expect(startingTribe).to.be.bignumber.equal(new BN('0'));

        // get all of the pending rewards for this user
        const allPendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
        // harvest all rewards
        await this.tribalChief.harvest(pid, userAddress, { from: userAddress });
        const endingTribe = await this.tribe.balanceOf(userAddress);
        expect(endingTribe).to.be.bignumber.equal(allPendingTribe);

        // ensure user does not have any pending rewards remaining
        const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
        expect(pendingTribe).to.be.bignumber.equal(new BN('0'));
      });
    });

    describe('Governor Rewards Changes', () => {
      it('governor should be able to step down the pool multiplier, which unlocks users funds', async function () {
      // assert that this pool is locked
        expect(
          (await this.tribalChief.poolInfo(pid)).unlocked,
        ).to.be.false;
        await this.tribalChief.governorAddPoolMultiplier(
          pid, 100, zeroMultiplier, { from: governorAddress },
        );
        // assert that this pool is now unlocked
        expect(
          (await this.tribalChief.poolInfo(pid)).unlocked,
        ).to.be.true;
        expect(
          (await this.tribalChief.rewardMultipliers(pid, 100)).toString(),
        ).to.be.bignumber.equal(zeroMultiplier);
      });

      it('governor should be able to step up the pool multiplier', async function () {
        const userAddresses = [userAddress];
        await this.tribalChief.governorAddPoolMultiplier(
          pid, 100, multiplier20, { from: governorAddress },
        );
        // assert that the pool did not unlock
        expect(
          (await this.tribalChief.poolInfo(pid)).unlocked,
        ).to.be.false;
        expect(
          await this.tribalChief.rewardMultipliers(pid, 100),
        ).to.be.bignumber.equal(multiplier20);
        // now have a user test and ensure this new reward is given
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('100000000000000000000'),
          3,
          100,
          totalStaked,
          pid,
        );
      });

      it('governor should be able to step up the pool multiplier and rewards should be given for 90 blocks after unlock', async function () {
        const userAddresses = [userAddress];
        await this.tribalChief.governorAddPoolMultiplier(
          pid, 100, multiplier20, { from: governorAddress },
        );
        // assert that the pool did not unlock
        expect(
          (await this.tribalChief.poolInfo(pid)).unlocked,
        ).to.be.false;
        expect(
          await this.tribalChief.rewardMultipliers(pid, 100),
        ).to.be.bignumber.equal(multiplier20);
        // now have a user test and ensure this new reward is given
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('100000000000000000000'),
          3,
          100,
          totalStaked,
          pid,
        );
      });

      it('tribalChief should revert when adding a new rewards pool without any multplier data', async function () {
        await expectRevert(
          this.tribalChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            [],
            { from: governorAddress },
          ),
          'must specify rewards',
        );
      });

      it('tribalChief should revert when adding a new rewards pool with an invalid 0 lock length multiplier', async function () {
        await expectRevert(
          this.tribalChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            [{
              lockLength: 0,
              rewardMultiplier: 0,
            }],
            { from: governorAddress },
          ),
          'invalid multiplier for 0 lock length',
        );
      });

      it('tribalChief should revert when adding a new rewards pool with a multiplier below scale factor', async function () {
        await expectRevert(
          this.tribalChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            [{
              lockLength: 10,
              rewardMultiplier: 0,
            }],
            { from: governorAddress },
          ),
          'invalid multiplier, must be above scale factor',
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
            await this.LPToken.approve(this.tribalChief.address, totalStaked, { from: address });
            const tx = await this.tribalChief.deposit(pid, totalStaked, 0, { from: address });
            const obj = {
              gas: tx.receipt.gasUsed,
              msg: `user ${j} gas used for deposit ${i}`,
            };
            depositReport.push(obj);
          }
        }
      });

      it('benchamarking withdrawFromDeposit and harvest with multiple users', async function () {
        const userAddresses = [
          userAddress,
          secondUserAddress,
          thirdUserAddress,
        ];

        expect(Number(await this.tribalChief.numPools())).to.be.equal(1);

        await testMultipleUsersPooling(
          this.tribalChief,
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
          const pendingTribeBeforeHarvest = await this.tribalChief.allPendingRewards(pid, address);

          const index = (await this.tribalChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
          const tx = await this.tribalChief.withdrawFromDeposit(
            pid, totalStaked, address, index, { from: address },
          );
          const obj = {
            gas: tx.receipt.gasUsed,
            msg: `user ${i} withdraws from deposit`,
          };
          withdrawFromDepositReport.push(obj);

          expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN(totalStaked));
          expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

          const pendingTribe = await this.tribalChief.allPendingRewards(pid, address);
          expect(pendingTribe).to.be.bignumber.gt(pendingTribeBeforeHarvest);

          const harvestTx = await this.tribalChief.harvest(pid, address, { from: address });
          harvestReport.push({
            gas: harvestTx.receipt.gasUsed,
            msg: `user ${i} harvests`,
          });
          const tribeBalance = await this.tribe.balanceOf(address);
          expect(tribeBalance).to.be.bignumber.gte(pendingTribe);
        }
      });

      it('benchmarking withdrawAllAndHarvest with multiple deposits', async function () {
        const userAddresses = [userAddress];

        await this.LPToken.approve(this.tribalChief.address, '100000000000000000000000000000000000');
        for (let i = 1; i < 20; i++) {
          await testMultipleUsersPooling(
            this.tribalChief,
            this.LPToken,
            userAddresses,
            new BN('100000000000000000000'),
            0,
            0,
            totalStaked,
            pid,
          );

          const tx = await this.tribalChief.withdrawAllAndHarvest(
            pid, userAddress, { from: userAddress },
          );
          const obj = {
            gas: tx.receipt.gasUsed,
            msg: `gas used withdrawing all and harvesting with ${i} deposits`,
          };
          withdrawAllAndHarvestReport.push(obj);

          expect(
            await this.LPToken.balanceOf(userAddress),
          ).to.be.bignumber.equal((new BN(totalStaked)).mul(new BN(i.toString())));

          // ensure that the reward debt got zero'd out
          // virtual amount should go to 0
          const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
          expect(rewardDebt).to.be.bignumber.equal(new BN('0'));
          expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
          // ensure that the open user deposits got zero'd out and array is 0 length
          expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('0'));
          // ensure that the virtual total supply got zero'd as well
          expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));

          await this.LPToken.mint(
            userAddress,
            totalStaked,
          );
          userAddresses.push(userAddress);
        }
      });

      it('benchmarking emergency withdraw with multiple deposits', async function () {
        const userAddresses = [userAddress];

        await this.LPToken.approve(this.tribalChief.address, '100000000000000000000000000000000000');
        for (let i = 1; i < 20; i++) {
          await testMultipleUsersPooling(
            this.tribalChief,
            this.LPToken,
            userAddresses,
            new BN('100000000000000000000'),
            0,
            0,
            totalStaked,
            pid,
          );

          const tx = await this.tribalChief.emergencyWithdraw(
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
          const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
          expect(rewardDebt).to.be.bignumber.equal(new BN('0'));
          expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
          // ensure that the open user deposits got zero'd out and array is 0 length
          expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('0'));
          // ensure that the virtual total supply got zero'd as well
          expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));

          await this.LPToken.mint(
            userAddress,
            totalStaked,
          );
        }
      });

      it('benchmarking withdrawAllAndHarvest', async function () {
        const userAddresses = [userAddress];

        // we should only be receiving 1e20 tribe per block
        await testMultipleUsersPooling(
          this.tribalChief,
          this.LPToken,
          userAddresses,
          new BN('100000000000000000000'),
          3,
          this.lockLength,
          totalStaked,
          pid,
        );
        expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));

        const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
        const tx = await this.tribalChief.withdrawAllAndHarvest(
          pid, userAddress, { from: userAddress },
        );
        const obj = {
          gas: tx.receipt.gasUsed,
          msg: 'gas used withdrawing all and harvesting when tokens are locked and only harvesting with 1 deposit',
        };
        withdrawAllAndHarvestReport.push(obj);

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

  describe('Test Pool with Force Lockup', () => {
    beforeEach(async function () {
      this.core = await getCore(false);

      this.tribe = await Tribe.new();
      this.coreRef = await MockCoreRef.new(this.core.address);

      this.tribalChief = await TribalChief.new(this.core.address, this.tribe.address);

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

      // mint tribe tokens to the tribalChief contract to distribute as rewards
      await this.tribe.mint(this.tribalChief.address, mintAmount, { from: minterAddress });
      this.multiplier = multiplier20;
      expect(await this.tribalChief.totalAllocPoint()).to.be.bignumber.equal(new BN('0'));

      // create new reward stream
      const tx = await this.tribalChief.add(
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
          {
            lockLength: 0,
            rewardMultiplier: zeroMultiplier,
          },
        ],
        { from: governorAddress },
      );

      // grab PID from the logs
      pid = Number(tx.logs[0].args.pid);
      expect(
        await this.tribalChief.totalAllocPoint(),
      ).to.be.bignumber.equal(new BN(allocationPoints.toString()));
      expect(await this.tribalChief.numPools()).to.be.bignumber.equal(new BN('1'));

      // set allocation points of earlier pool to 0 so that
      // full block rewards are given out to this pool
      expect(await this.tribalChief.totalAllocPoint()).to.be.bignumber.equal(new BN('100'));

      expect(
        (await this.tribalChief.poolInfo(0)).allocPoint,
      ).to.be.bignumber.equal(new BN(allocationPoints.toString()));
    });

    it('should be able to get allocation points and update allocation points for adding a new pool', async function () {
      expect(await this.tribalChief.totalAllocPoint()).to.be.bignumber.equal(new BN('100'));
      expect(await this.tribalChief.numPools()).to.be.bignumber.equal(new BN('1'));
      // create new reward stream
      await this.tribalChief.add(
        allocationPoints,
        this.LPToken.address,
        ZERO_ADDRESS,
        [
          {
            lockLength: 100,
            rewardMultiplier: zeroMultiplier,
          },
        ],
        { from: governorAddress },
      );

      expect(await this.tribalChief.numPools()).to.be.bignumber.equal(new BN('2'));
      expect(await this.tribalChief.totalAllocPoint()).to.be.bignumber.equal(new BN('200'));
    });

    it('should be able to get pending sushi and receive multiplier for depositing on force lock pool', async function () {
      const userAddresses = [userAddress];
      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        10,
        300,
        totalStaked,
        pid,
      );
    });

    it('should be able to get pending sushi and receive different multipliers for depositing on force lock pool', async function () {
      const userAddresses = [userAddress, secondUserAddress];
      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        [new BN('25000000000000000000'), new BN('75000000000000000000')],
        10,
        [100, 300],
        totalStaked,
        pid,
      );
    });

    it('should be able to get pending sushi and receive the same multipliers for depositing on force lock pool', async function () {
      const userAddresses = [userAddress, secondUserAddress];
      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        [new BN('50000000000000000000'), new BN('50000000000000000000')],
        10,
        [100, 100],
        totalStaked,
        pid,
      );
    });

    it('should not be able to emergency withdraw from a forced lock pool when a users tokens are locked', async function () {
      const userAddresses = [userAddress];

      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        5,
        100,
        totalStaked,
        pid,
      );

      await expectRevert(
        this.tribalChief.emergencyWithdraw(pid, userAddress, { from: userAddress }),
        'tokens locked',
      );
    });

    it('should not be able to emergency withdraw from a forced lock pool when the first deposit is unlocked and the other is locked', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        1,
        0,
        '50000000000000000000',
        pid,
      );

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        1,
        100,
        '50000000000000000000',
        pid,
      );

      await expectRevert(
        this.tribalChief.emergencyWithdraw(pid, userAddress, { from: userAddress }),
        'tokens locked',
      );
    });

    it('should not be able to emergency withdraw from a forced lock pool when a users tokens are locked', async function () {
      const userAddresses = [userAddress];

      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        5,
        100,
        totalStaked,
        pid,
      );

      await expectRevert(
        this.tribalChief.emergencyWithdraw(pid, userAddress, { from: userAddress }),
        'tokens locked',
      );
    });

    it('should be able to emergency withdraw from a forced lock pool when a users tokens are past the unlock block', async function () {
      const userAddresses = [userAddress];

      expect(Number(await this.tribalChief.numPools())).to.be.equal(1);
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        100,
        100,
        totalStaked,
        pid,
      );

      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('1'));
      expectEvent(
        await this.tribalChief.emergencyWithdraw(pid, userAddress, { from: userAddress }),
        'EmergencyWithdraw', {
          user: userAddress,
          pid: new BN(pid.toString()),
          amount: new BN(totalStaked),
          to: userAddress,
        },
      );
      // ensure that the reward debt got zero'd out
      // virtual amount should go to 0
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(rewardDebt).to.be.bignumber.equal(new BN('0'));
      expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
      // ensure that the open user deposits got zero'd out and array is 0 length
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('0'));
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));
    });
  });

  describe('Test Rewards Multiplier', () => {
    beforeEach(async function () {
      this.core = await getCore(false);

      this.tribe = await Tribe.new();
      this.coreRef = await MockCoreRef.new(this.core.address);

      this.tribalChief = await TribalChief.new(this.core.address, this.tribe.address);

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

      // mint tribe tokens to the tribalChief contract to distribute as rewards
      await this.tribe.mint(this.tribalChief.address, mintAmount, { from: minterAddress });

      this.multiplier = multiplier20;
      this.lockLength = 100;
      // create new reward stream
      const tx = await this.tribalChief.add(
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
    });

    it('should be able to mass update pools', async function () {
      await this.tribalChief.add(
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

      await this.tribalChief.massUpdatePools([0, 1]);
      // assert that both pools got updated last block
      expect(
        (await this.tribalChief.poolInfo(0)).lastRewardBlock,
      ).to.be.bignumber.equal(
        (await this.tribalChief.poolInfo(1)).lastRewardBlock,
      );

      // ensure that the last reward block isn't 0 for both pools
      expect(
        (await this.tribalChief.poolInfo(0)).lastRewardBlock,
      ).to.be.bignumber.gt(
        new BN('0'),
      );
    });

    it('should be able to update a single pool', async function () {
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        [userAddress],
        new BN('100000000000000000000'),
        1,
        this.lockLength,
        totalStaked,
        pid,
      );

      const { accTribePerShare, lastRewardBlock } = await this.tribalChief.poolInfo(pid);
      await this.tribalChief.updatePool(pid);

      const newAccTribePerShare = (await this.tribalChief.poolInfo(pid)).accTribePerShare;
      const newRewardBlock = (await this.tribalChief.poolInfo(pid)).lastRewardBlock;

      expect(newAccTribePerShare).to.be.bignumber.gt(accTribePerShare);
      expect(newRewardBlock).to.be.bignumber.gt(lastRewardBlock);
    });

    it('should be able to get pending sushi and receive multiplier for locking', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        10,
        this.lockLength,
        totalStaked,
        pid,
      );
    });

    it('should not be able to deposit with an unsupported locklength', async function () {
      await this.LPToken.approve(this.tribalChief.address, totalStaked, { from: userAddress });
      await expectRevert(
        this.tribalChief.deposit(pid, totalStaked, 100000, { from: userAddress }),
        'invalid lock length',
      );
    });

    it('should not be able to deposit without LPToken approval', async function () {
      await expectRevert(
        this.tribalChief.deposit(pid, totalStaked, 100, { from: userAddress }),
        'transfer amount exceeds allowance',
      );
    });

    it('should not be able to withdraw before locking period is over', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid,
      );

      await expectRevert(
        this.tribalChief.withdrawFromDeposit(
          pid, totalStaked, userAddress, 0, { from: userAddress },
        ),
        'tokens locked',
      );
    });

    it('should not be able to withdraw more tokens than deposited', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        100,
        this.lockLength,
        totalStaked,
        pid,
      );

      await expectRevert.unspecified(
        this.tribalChief.withdrawFromDeposit(
          pid, '100000000000000000001', userAddress, 0, { from: userAddress },
        ),
      );
    });

    it('should be able to withdraw before locking period is over when governor force unlocks pool', async function () {
      const userAddresses = [userAddress];

      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid,
      );

      await this.tribalChief.unlockPool(pid, { from: governorAddress });
      expect((await this.tribalChief.poolInfo(pid)).unlocked).to.be.true;

      await this.tribalChief.withdrawFromDeposit(
        pid, totalStaked, userAddress, 0, { from: userAddress },
      );

      // ensure lp tokens were refunded and reward debt went negative
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(rewardDebt).to.be.bignumber.lt(new BN('-1'));
      expect(virtualAmount).to.be.bignumber.eq(new BN('0'));
    });

    it('should not be able to emergency withdraw before locking period is over', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid,
      );

      await expectRevert(
        this.tribalChief.emergencyWithdraw(pid, userAddress, { from: userAddress }),
        'tokens locked',
      );
    });

    it('should not be able to withdraw principle before locking period is over by calling withdrawAllAndHarvest', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        3,
        this.lockLength,
        totalStaked,
        pid,
      );

      const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
      await this.tribalChief.withdrawAllAndHarvest(pid, userAddress, { from: userAddress });
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.gte(pendingTribe);
    });

    it('should be able to withdraw principle after locking period is over by calling withdrawAllAndHarvest', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        this.lockLength,
        this.lockLength,
        totalStaked,
        pid,
      );

      const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
      await this.tribalChief.withdrawAllAndHarvest(pid, userAddress, { from: userAddress });
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.gte(pendingTribe);
      // assert that virtual amount and reward debt updated correctly
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
      expect(rewardDebt).to.be.bignumber.equal(new BN('0'));
      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));
    });

    it('calling withdrawAllAndHarvest after lockup period should delete arrays when all liquidity is withdrawn from that pool', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        50,
        this.lockLength,
        totalStaked,
        pid,
      );

      await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
      await this.LPToken.approve(this.tribalChief.address, totalStaked);
      await this.tribalChief.deposit(pid, totalStaked, this.lockLength, { from: userAddress });
      expect((await this.tribalChief.openUserDeposits(pid, userAddress))).to.be.bignumber.equal(new BN('2'));
      // assert that the virtual total supply is equal
      // to the staked amount which is total staked x 2
      expect(
        (await this.tribalChief.poolInfo(pid)).virtualTotalSupply,
      ).to.be.bignumber.equal((new BN(totalStaked)).mul(new BN('2')));

      for (let i = 0; i < 50; i++) {
        await time.advanceBlock();
      }

      let pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
      await this.tribalChief.withdrawAllAndHarvest(pid, userAddress, { from: userAddress });

      // there should still be 2 open user deposits as the first deposit just got
      // zero'd out and did not get deleted
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('2'));

      // assert that the deposit info is zero'd out after this users withdraw call
      const {
        amount,
        unlockBlock,
        multiplier,
      } = await this.tribalChief.depositInfo(pid, userAddress, 0);
      expect(amount).to.be.bignumber.equal(new BN('0'));
      expect(unlockBlock).to.be.bignumber.equal(new BN('0'));
      expect(multiplier).to.be.bignumber.equal(new BN('0'));

      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.gte(pendingTribe);

      for (let i = 0; i < 50; i++) {
        await time.advanceBlock();
      }
      pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
      const currentTribe = await this.tribe.balanceOf(userAddress);
      // assert that the virtual total supply is equal to the staked amount
      expect(
        (await this.tribalChief.poolInfo(pid)).virtualTotalSupply,
      ).to.be.bignumber.equal(new BN(totalStaked));
      await this.tribalChief.withdrawAllAndHarvest(pid, userAddress, { from: userAddress });
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal((new BN(totalStaked)).mul(new BN('2')));

      expect(
        await this.tribe.balanceOf(userAddress),
      ).to.be.bignumber.gte(currentTribe.add(pendingTribe));

      // ensure that the open deposits are now 0 as they should have been
      // deleted in the withdrawallandharvest function call
      expect(await this.tribalChief.openUserDeposits(pid, userAddress)).to.be.bignumber.equal(new BN('0'));

      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));

      // assert that virtual amount and reward debt updated correctly
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
      expect(rewardDebt).to.be.bignumber.equal(new BN('0'));
    });

    it('Negative rewards debt when calling withdrawAllAndHarvest should not revert and should give out correct reward amount', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        this.lockLength,
        this.lockLength,
        totalStaked,
        pid,
      );

      const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
      await this.tribalChief.withdrawFromDeposit(
        pid, totalStaked, userAddress, 0, { from: userAddress },
      );
      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));

      // expect that reward debt goes negative when we withdraw and don't harvest
      expect((await this.tribalChief.userInfo(pid, userAddress)).rewardDebt).to.be.bignumber.lt(new BN('-1'));

      await this.tribalChief.withdrawAllAndHarvest(pid, userAddress, { from: userAddress });
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.gte(pendingTribe);

      // assert that virtual amount and reward debt updated correctly
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
      expect(rewardDebt).to.be.bignumber.equal(new BN('0'));

      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));
    });

    it('should be able to withdraw principle after locking period is over by calling withdraw and then harvest', async function () {
      const userAddresses = [userAddress];

      // we should only be receiving 1e20 tribe per block
      await testMultipleUsersPooling(
        this.tribalChief,
        this.LPToken,
        userAddresses,
        new BN('100000000000000000000'),
        this.lockLength,
        this.lockLength,
        totalStaked,
        pid,
      );

      const pendingTribe = await this.tribalChief.allPendingRewards(pid, userAddress);
      await this.tribalChief.withdrawFromDeposit(
        pid, totalStaked, userAddress, 0, { from: userAddress },
      );
      await this.tribalChief.harvest(pid, userAddress, { from: userAddress });

      expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));
      expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.gte(pendingTribe);
      // assert that virtual amount and reward debt updated
      // correctly on the withdrawFromDeposit call
      const { rewardDebt, virtualAmount } = await this.tribalChief.userInfo(pid, userAddress);
      expect(virtualAmount).to.be.bignumber.equal(new BN('0'));
      expect(rewardDebt).to.be.bignumber.equal(new BN('0'));
      // assert that the virtual total supply is 0
      expect((await this.tribalChief.poolInfo(pid)).virtualTotalSupply).to.be.bignumber.equal(new BN('0'));
    });
  });
});
