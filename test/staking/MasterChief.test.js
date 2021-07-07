const {
  BN,
  expectEvent,
  expectRevert,
  expect,
  getCore,
  getAddresses,
  expectApprox,
  testMultipleUsersPooling,
} = require('../helpers');
const { time } = require('@openzeppelin/test-helpers');

const Tribe = artifacts.require('MockTribe');
const MockCoreRef = artifacts.require('MockCoreRef');
const MasterChief = artifacts.require('MasterChief');
const MockERC20 = artifacts.require('MockERC20');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

describe('MasterChief', function () {
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

  // we will have a 10 block lockup period to start
  const lockupPeriod = 10;
  const forcedLock = false;
  const unlocked = false;
  // rewards multiplier
  const multiplier = 1.1e18;
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
    sixthUserAddress  = pcvControllerAddress;
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
        lockupPeriod,
        forcedLock,
        unlocked,
        [],
        { from: governorAddress }
    );
    // grab PID from the logs
    pid = Number(tx.logs[0].args.pid);
    // grab the per block reward by calling the masterchief contract
    perBlockReward = Number(await this.masterChief.tribePerBlock());
  });

  describe('Test Security', function() {
    it('should not be able to add rewards stream as non governor', async function() {
        await expectRevert(
            this.masterChief.add(
                allocationPoints,
                this.LPToken.address,
                ZERO_ADDRESS,
                lockupPeriod,
                forcedLock,
                unlocked,
                [],
                { from: userAddress }
            ),
            "CoreRef: Caller is not a governor",
        );
    });

    it('should not be able to change rewards multiplier as non governor', async function() {
        await expectRevert(
            this.masterChief.governorAddPoolMultiplier(pid, 0, 0, { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('governor should be able to add rewards stream', async function() {
        expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
        await this.masterChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );
        expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
        expect((await this.masterChief.poolInfo(1)).allocPoint).to.be.bignumber.equal(new BN(allocationPoints));
    });

    it('should not be able to set rewards stream as non governor', async function() {
        await expectRevert(
            this.masterChief.set(0, allocationPoints, this.LPToken.address, true, { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('governor should be able to set rewards stream with new amount of allocation points', async function() {
        const newAllocationPoints = 10;
        await this.masterChief.set(0, newAllocationPoints, this.LPToken.address, true, { from: governorAddress });
        expect((await this.masterChief.poolInfo(pid)).allocPoint).to.be.bignumber.equal(new BN(newAllocationPoints));
    });

    it('should not be able to governorWithdrawTribe as non governor', async function() {
        await expectRevert(
            this.masterChief.governorWithdrawTribe('100000000', { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('should be able to governorWithdrawTribe as governor', async function() {
        const withdrawAmount = await this.tribe.balanceOf(this.masterChief.address);
        expect(withdrawAmount).to.be.bignumber.equal(mintAmount);
        expectEvent(
            await this.masterChief.governorWithdrawTribe(withdrawAmount, { from: governorAddress }),
            'TribeWithdraw', 
            {
                amount: withdrawAmount
            }
        );

        const coreBalance = await this.tribe.balanceOf(this.core.address);
        expect(coreBalance).to.be.bignumber.equal(mintAmount);
        
        const afterMasterChiefBalance = await this.tribe.balanceOf(this.masterChief.address);
        expect(afterMasterChiefBalance).to.be.bignumber.equal(new BN('0'));
    });

    it('should not be able to updateBlockReward as non governor', async function() {
        await expectRevert(
            this.masterChief.updateBlockReward('100000000', { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('governor should be able to updateBlockReward', async function() {
        const newBlockRewards = [1000000000, 2000000000, 3000000000, 4000000000, 5000000000, 6000000000];
        expect(await this.masterChief.tribePerBlock()).to.be.bignumber.equal(new BN('100000000000000000000'));
        for (let i = 0; i < newBlockRewards.length; i++) {
            // update the block reward
            await this.masterChief.updateBlockReward(newBlockRewards[i], { from: governorAddress });
            // assert this new block reward is in place
            expect(await this.masterChief.tribePerBlock()).to.be.bignumber.equal(new BN(newBlockRewards[i]));
        }
    });
  });

  describe('Test Staking', function() {
    it('should be able to stake LP Tokens', async function() {
        expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });
        expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));

        // grab the index by getting the amount of deposit they have and subtracting 1
        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        // assert user has received their balance in the masterchief contract registered under their account
        expect((await this.masterChief.depositInfo(pid, userAddress, index)).amount).to.be.bignumber.equal(new BN(totalStaked));
    });

    it('should be able to get pending sushi', async function() {
        const userAddresses = [ userAddress ];

        expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
         
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('100000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
    });


    it('should be able to get pending sushi', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        expect(Number(await this.masterChief.pendingRewards(pid, userAddress, index))).to.be.equal(perBlockReward * advanceBlockAmount);
    });

    it('should be able to get pending sushi after one block with a single pool and user staking', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });

        await time.advanceBlock();

        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        expect(Number(await this.masterChief.pendingRewards(pid, userAddress, index))).to.be.equal(perBlockReward);
    });

    it('should be able to step down rewards by creating a new PID for curve with equal allocation points after 10 blocks, then go another 10 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        expect(Number(await this.masterChief.pendingRewards(pid, userAddress, index))).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });

        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        // adding another PID for curve will cut user rewards in half for users staked in the first pool
        const addTx = await this.masterChief.add(
            allocationPoints,
            this.curveLPToken.address,
            ZERO_ADDRESS,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );

        const pid2 = Number(addTx.logs[0].args.pid);
        await this.curveLPToken.approve(this.masterChief.address, totalStaked, { from: secondUserAddress });
        await this.masterChief.deposit(pid2, totalStaked, 0, { from: secondUserAddress });

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // we did 5 tx's before starting and then do 1 tx to harvest so start with i at 3.
        for (let i = 5; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });

        const endingTribeBalance = await this.tribe.balanceOf(userAddress);
        const rewardAmount = endingTribeBalance.sub(startingTribeBalance);

        // for 7 blocks, we received half of the rewards of one pool. For one block after the 10 blocks, we received 100% of all block rewards
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal( new BN((((perBlockReward / 2)  * (advanceBlockAmount - 3)) + (perBlockReward)).toString()).add(startingTribeBalance) );

        await this.masterChief.harvest(pid2, secondUserAddress, index, { from: secondUserAddress });

        // subtract 2 from the advance block amount as we have advanced two less blocks when calling the harvest function
        expect(Number(await this.tribe.balanceOf(secondUserAddress))).to.be.equal( (perBlockReward / 2)  * (advanceBlockAmount - 3));
    });

    // this test will test what happens when we update the block reward after a user has already accrued rewards
    it('should be able to step down rewards by halving rewards per block after 10 blocks, then go another 10 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        expect(Number(await this.masterChief.pendingRewards(pid, userAddress, index))).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });

        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        await this.masterChief.updateBlockReward('50000000000000000000', { from: governorAddress });

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // we did 3 tx's before starting so start with i at 3.
        for (let i = 3; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        const expectedAmount = startingTribeBalance.add( new BN(((perBlockReward / 2)  * (advanceBlockAmount - 1)).toString() ) );
        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });
        expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(expectedAmount);
    });

    it('should be able to step down rewards by creating a new PID with equal allocation points after 10 blocks, then go another 5 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }
        
        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        expect(Number(await this.masterChief.pendingRewards(pid, userAddress, index))).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });

        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        const startingTribeBalance = await this.tribe.balanceOf(userAddress);

        // adding another PID will cut user rewards in half for users staked in the first pool
        await this.masterChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );

        // we did 2 tx's before starting so start with i at 2.
        for (let i = 2; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });
        const endingTribeBalance = await this.tribe.balanceOf(userAddress);
        const rewardAmount = endingTribeBalance.sub(startingTribeBalance);

        expect(rewardAmount).to.be.bignumber.equal( new BN( ((perBlockReward / 2)  * advanceBlockAmount ).toString()));
    });

    it('should be able to get pending sushi after 10 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        expect(Number(await this.masterChief.pendingRewards(pid, userAddress, index))).to.be.equal(perBlockReward * advanceBlockAmount);
        
        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });
        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));
    });

    it('should be able to get pending sushi 10 blocks with 2 users staking', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: secondUserAddress });

        await this.masterChief.deposit(pid, totalStaked, 0, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, 0, { from: secondUserAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }
        
        const index = (await this.masterChief.openUserDeposits(pid, userAddress)).sub(new BN('1')).toString();
        // validate that the balance of the user is correct before harvesting rewards
        expect(Number(await this.masterChief.pendingRewards(pid, userAddress, index))).to.be.equal( ( ( perBlockReward * advanceBlockAmount ) / 2 ) + perBlockReward );
        expect(Number(await this.masterChief.pendingRewards(pid, secondUserAddress, index))).to.be.equal( ( ( perBlockReward * advanceBlockAmount ) / 2 ) );
        
        await this.masterChief.harvest(pid, secondUserAddress, index, { from: secondUserAddress });
        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(secondUserAddress))).to.be.equal( ( ( perBlockReward * (advanceBlockAmount + 1) ) / 2 ) );
        
        await this.masterChief.harvest(pid, userAddress, index, { from: userAddress });
        // add on two to the advance block amount as we have advanced two more blocks before calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal( ( ( perBlockReward * advanceBlockAmount ) / 2 ) + perBlockReward * 2 );
    });

    it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function', async function() {
        const userAddresses = [ userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress, fifthUserAddress ];
        
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('20000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
    });

    it('should be able to distribute sushi after 10 blocks with 4 users staking using helper function', async function() {
        const userAddresses = [ userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress ];
        
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('25000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
    });

    it('should be able to distribute sushi after 10 blocks with 2 users staking using helper function', async function() {
        const userAddresses = [ userAddress, secondUserAddress ];
        
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('50000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
    });

    it('should be able to distribute sushi after 10 blocks with 10 users staking using helper function', async function() {
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
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('10000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
    });

    it('should be able to distribute sushi after 10 blocks with 10 users staking using helper function and 2 staking PIDs', async function() {
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

        await this.masterChief.add(
            allocationPoints,
            this.LPToken.address,
            this.tribe.address,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );
        expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('5000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
    });

    it('should be able to assert poolLength', async function() {
        expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
    });
  });

  describe('Test Withdraw and Staking', function() {
    it('should be able to distribute sushi after 10 blocks with 10 users staking using helper function and 2 staking PIDs', async function() {
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

        await this.masterChief.add(
            allocationPoints,
            this.LPToken.address,
            this.tribe.address,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );
        expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
         
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('5000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
        for (let i = 0; i < userAddresses.length; i++) {
            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            
            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribe = await this.masterChief.pendingRewards(pid, userAddresses[i], index);
            await this.masterChief.withdrawAndHarvest(pid, totalStaked, userAddresses[i], index, { from: userAddresses[i] });

            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.gt(pendingTribe);
        }
    });

    it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 2 staking PIDs', async function() {
        const userAddresses = [
            userAddress,
            secondUserAddress,
            thirdUserAddress,
            fourthUserAddress,
            fifthUserAddress,
         ];

        await this.masterChief.add(
            allocationPoints,
            this.LPToken.address,
            this.tribe.address,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );
        expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
         
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('10000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );
        for (let i = 0; i < userAddresses.length; i++) {
            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribe = await this.masterChief.pendingRewards(pid, userAddresses[i], index);
            await this.masterChief.withdrawAndHarvest(pid, totalStaked, userAddresses[i], index, { from: userAddresses[i] });

            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.gt(pendingTribe);
        }
    });

    it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 1 staking PIDs', async function() {
        const userAddresses = [
            userAddress,
            secondUserAddress,
            thirdUserAddress,
            fourthUserAddress,
            fifthUserAddress,
        ];

        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('20000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribe = await this.masterChief.pendingRewards(pid, userAddresses[i], index);
            await this.masterChief.withdrawAndHarvest(pid, totalStaked, userAddresses[i], index, { from: userAddresses[i] });

            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.gt(pendingTribe);
        }
    });

    it('should be able to distribute sushi after 10 blocks with 2 users staking using helper function and 5 staking PIDs', async function() {
        const userAddresses = [
            userAddress,
            secondUserAddress,
        ];

        // only add 4 pools as the before each hook always adds 1 pool
        for (let i = 1; i < 5; i++) {
            await this.masterChief.add(
                allocationPoints,
                this.LPToken.address,
                this.tribe.address,
                lockupPeriod,
                forcedLock,
                unlocked,
                [],
                { from: governorAddress }
            );
            expect(Number(await this.masterChief.poolLength())).to.be.equal(1 + i);
        }
        // assert that we have 5 pools
        expect(Number(await this.masterChief.poolLength())).to.be.equal(5);

        // this reward should be ( 1e20 / 5 pools / 2 users ) = 2000000000000000000,
        // however, the actual reward is 10000000000000000000
        // if you take 1e20 and divide by ( 5 * 2), then the reward per block per user is 1e19, so then this math makes sense
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('10000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribe = await this.masterChief.pendingRewards(pid, userAddresses[i], index);
            await this.masterChief.withdrawAndHarvest(pid, totalStaked, userAddresses[i], index, { from: userAddresses[i] });

            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.gt(pendingTribe);
        }
    });

    it('should be able to distribute sushi after 10 blocks with 4 users staking using helper function and 1 staking PIDs', async function() {
        const userAddresses = [
            userAddress,
            secondUserAddress,
            thirdUserAddress,
            fourthUserAddress,
        ];

        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('25000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            
            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribe = await this.masterChief.pendingRewards(pid, userAddresses[i], index);
            await this.masterChief.withdrawAndHarvest(pid, totalStaked, userAddresses[i], index, { from: userAddresses[i] });

            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.gt(pendingTribe);
        }
    });

    it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function and 2 staking PIDs', async function() {
        const userAddresses = [
            userAddress,
            secondUserAddress,
            thirdUserAddress,
            fourthUserAddress,
            fifthUserAddress,
        ];

        await this.masterChief.add(
            allocationPoints,
            this.LPToken.address,
            this.tribe.address,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );
        expect(Number(await this.masterChief.poolLength())).to.be.equal(2);

        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('10000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN('0'));

            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribe = await this.masterChief.pendingRewards(pid, userAddresses[i], index);
            await this.masterChief.withdrawAndHarvest(pid, totalStaked, userAddresses[i], index, { from: userAddresses[i] });

            expect(await this.LPToken.balanceOf(userAddresses[i])).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(userAddresses[i])).to.be.bignumber.gt(pendingTribe);
        }
    });
  });

  describe('Test Withdraw and Harvest Scenarios', function() {
    it('should be able to distribute sushi after 10 blocks with 10 users staking by withdrawing and then harvest with 2 PIDs', async function() {
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

        await this.masterChief.add(
            allocationPoints,
            this.LPToken.address,
            ZERO_ADDRESS,
            lockupPeriod,
            forcedLock,
            unlocked,
            [],
            { from: governorAddress }
        );

        expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
         
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            new BN('5000000000000000000'),
            10,
            0,
            totalStaked,
            pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
            const address = userAddresses[i];

            expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribeBeforeHarvest = await this.masterChief.pendingRewards(pid, address, index);
            await this.masterChief.withdrawFromDeposit(pid, totalStaked, address, index, { from: address });

            expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

            // assert that reward debt went negative after we withdrew all of our principle without harvesting
            expect((await this.masterChief.depositInfo(pid, address, index)).rewardDebt).to.be.bignumber.lt(new BN('-1'))

            const pendingTribe = await this.masterChief.pendingRewards(pid, address, index);
            expect(pendingTribe).to.be.bignumber.gt(pendingTribeBeforeHarvest);

            await this.masterChief.harvest(pid, address, index, { from:  address });
            const tribeBalance = await this.tribe.balanceOf(address);
            expect(tribeBalance).to.be.bignumber.gte(pendingTribe);
        }
    });

    it('should be able to distribute sushi after 10 blocks with 3 users staking by withdrawing and then harvesting with 2 PIDs', async function() {
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
            pid
        );

        for (let i = 0; i < userAddresses.length; i++) {
            const address = userAddresses[i];

            expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN('0'));
            expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

            // subtract 1 from the amount of deposits
            const index = (await this.masterChief.openUserDeposits(pid, userAddresses[i])).sub(new BN('1')).toString();
            const pendingTribeBeforeHarvest = await this.masterChief.pendingRewards(pid, address, index);

            await this.masterChief.withdrawFromDeposit(pid, totalStaked, address, index, { from: address });

            expect(await this.LPToken.balanceOf(address)).to.be.bignumber.equal(new BN(totalStaked));
            expect(await this.tribe.balanceOf(address)).to.be.bignumber.equal(new BN('0'));

            const pendingTribe = await this.masterChief.pendingRewards(pid, address, index);
            expect(pendingTribe).to.be.bignumber.gt(pendingTribeBeforeHarvest);

            await this.masterChief.harvest(pid, address, index, { from: address });
            const tribeBalance = await this.tribe.balanceOf(address);
            expect(tribeBalance).to.be.bignumber.gte(pendingTribe);
        }
    });

    it('allPendingRewards should be able to get all rewards data across multiple deposits in a single pool', async function() {
        const userAddresses = [
            userAddress,
            userAddress,
            secondUserAddress
        ];
        await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
        await this.LPToken.approve(this.masterChief.address, '200000000000000000000');

        const incrementAmount = new BN('33333333333300000000');
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            incrementAmount,
            1,
            0,
            totalStaked,
            pid
        );
        // users pending rewards for both deposits should be less than their sum
        expect(await this.masterChief.pendingRewards(pid, userAddress, 0)).to.be.bignumber.lt(await this.masterChief.allPendingRewards(pid, userAddress));
        expect(await this.masterChief.pendingRewards(pid, userAddress, 1)).to.be.bignumber.lt(await this.masterChief.allPendingRewards(pid, userAddress));

        const expectedPendingRewards = (await this.masterChief.pendingRewards(pid, userAddress, 0))
            .add(await this.masterChief.pendingRewards(pid, userAddress, 1));
        expectApprox(
            await this.masterChief.allPendingRewards(pid, userAddress),
            expectedPendingRewards
        );
    });

    it('harvestAll should be able to claim all rewards from multiple deposits in a single pool', async function() {
        const userAddresses = [
            userAddress,
            userAddress,
            secondUserAddress
        ];

        await this.LPToken.mint(userAddress, totalStaked); // approve double total staked
        await this.LPToken.approve(this.masterChief.address, '200000000000000000000');

        const incrementAmount = new BN('33333333333300000000');
        await testMultipleUsersPooling(
            this.masterChief,
            this.LPToken,
            userAddresses,
            incrementAmount,
            1,
            0,
            totalStaked,
            pid
        );
        // users pending rewards for both deposits should be less than their sum
        expect(await this.masterChief.pendingRewards(pid, userAddress, 0)).to.be.bignumber.lt(await this.masterChief.allPendingRewards(pid, userAddress));
        expect(await this.masterChief.pendingRewards(pid, userAddress, 1)).to.be.bignumber.lt(await this.masterChief.allPendingRewards(pid, userAddress));
        // users pending rewards for both deposits should be 2x increment amount
        // user got 2 blocks of full rewards so subtract block reward x 2 from their balance

        // grab all deposits and withdraw them without harvesting rewards
        const depositAmounts = Number(await this.masterChief.openUserDeposits(pid, userAddress));
        for (let i = 0; i < depositAmounts; i++) {
            const startingLP = await this.LPToken.balanceOf(userAddress);
            await this.masterChief.withdrawFromDeposit(pid, totalStaked, userAddress, i, { from: userAddress });
            const endingLP = await this.LPToken.balanceOf(userAddress);

            // ensure the users LPToken balance increased
            expect(startingLP.add(new BN(totalStaked))).to.be.bignumber.equal(endingLP);
        }
        
        const startingTribe = await this.tribe.balanceOf(userAddress);
        expect(startingTribe).to.be.bignumber.equal(new BN('0'));

        // get all of the pending rewards for this user
        const allPendingTribe = await this.masterChief.allPendingRewards(pid, userAddress);
        // harvest all rewards
        await this.masterChief.harvestAll(pid, userAddress, { from: userAddress });
        const endingTribe = await this.tribe.balanceOf(userAddress);
        expect(endingTribe).to.be.bignumber.equal(allPendingTribe);

        // ensure user does not have any pending rewards remaining
        for (let i = 0; i < depositAmounts; i++) {
            const pendingTribe = await this.masterChief.pendingRewards(pid, userAddress, i);
            expect(pendingTribe).to.be.bignumber.equal(new BN('0'));
        }
    });
  });
});
