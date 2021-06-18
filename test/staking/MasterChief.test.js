const {
  BN,
  expectEvent,
  expectRevert,
  expect,
  getCore,
  getAddresses,
} = require('../helpers');
const { time } = require('@openzeppelin/test-helpers');

const Tribe = artifacts.require('MockTribe');
const MockCoreRef = artifacts.require('MockCoreRef');
const MasterChief = artifacts.require('MasterChief');
const MockERC20 = artifacts.require('MockERC20');
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';
const ONE_ADDRESS = '0x0000000000000000000000000000000000000001';

describe('MasterChief', function () {
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

  const allocationPoints = 100;
  const totalStaked = '100000000000000000000';
  const perBlockReward = Number(100000000000000000000);
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
    const tx = await this.masterChief.add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, { from: governorAddress });
    // grab PID from the logs
    pid = Number(tx.logs[0].args.pid);
  });

  describe('Test Security', function() {
    it('should not be able to add rewards stream as non governor', async function() {
        await expectRevert(
            this.masterChief.add(allocationPoints, this.LPToken.address, this.tribe.address, { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('governor should be able to add rewards stream', async function() {
        expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
        await this.masterChief.add(allocationPoints, this.LPToken.address, this.tribe.address, { from: governorAddress });
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

    it('should not be able to setMigrator as non governor', async function() {
        await expectRevert(
            this.masterChief.setMigrator(this.LPToken.address, { from: userAddress }),
            "CoreRef: Caller is not a governor",
        );
    });

    it('governor should be able to setMigrator', async function() {
        expect(await this.masterChief.migrator()).to.be.equal(ZERO_ADDRESS);
        await this.masterChief.setMigrator(ONE_ADDRESS, { from: governorAddress });
        expect(await this.masterChief.migrator()).to.be.equal(ONE_ADDRESS);
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
        expect(await this.masterChief.sushiPerBlock()).to.be.bignumber.equal(new BN('100000000000000000000'));
        for (let i = 0; i < newBlockRewards.length; i++) {
            // update the block reward
            await this.masterChief.updateBlockReward(newBlockRewards[i], { from: governorAddress });
            // assert this new block reward is in place
            expect(await this.masterChief.sushiPerBlock()).to.be.bignumber.equal(new BN(newBlockRewards[i]));
        }
    });
  });

  describe('Test Staking', function() {
    it('should be able to stake LP Tokens', async function() {
        expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN(totalStaked));
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });
        expect(await this.LPToken.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        // assert user has received their balance in the masterchief contract registered under their account
        expect((await this.masterChief.userInfo(pid, userAddress)).amount).to.be.bignumber.equal(new BN(totalStaked));
    });

    it('should be able to get pending sushi', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });

        const advanceBlockAmount = 100;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward * advanceBlockAmount);
    });

    it('should be able to get pending sushi after one block with a single pool and user staking', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked);
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });

        await time.advanceBlock();

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward);
    });

    it('should be able to step down rewards by creating a new PID for curve with equal allocation points after 10 blocks, then go another 10 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }
        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.masterChief.harvest(pid, userAddress, { from: userAddress });

        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        // adding another PID for curve will cut user rewards in half for users staked in the first pool
        const pid2 = Number(
            (await this.masterChief.add(allocationPoints, this.curveLPToken.address, ZERO_ADDRESS, { from: governorAddress }))
            .logs[0].args.pid
        );

        await this.curveLPToken.approve(this.masterChief.address, totalStaked, { from: secondUserAddress });
        await this.masterChief.deposit(pid2, totalStaked, secondUserAddress, { from: secondUserAddress });

        // burn tribe tokens to make life easier when calculating rewards after this step up
        await this.tribe.transfer(ONE_ADDRESS, (await this.tribe.balanceOf(userAddress)).toString());

        // we did 5 tx's before starting and then do 1 tx to harvest so start with i at 3.
        for (let i = 5; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        await this.masterChief.harvest(pid, userAddress, { from: userAddress });
        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal( (perBlockReward / 2)  * (advanceBlockAmount));

        await this.masterChief.harvest(pid2, secondUserAddress, { from: secondUserAddress });

        // subtract 2 from the advance block amount as we have advanced two less blocks when calling the harvest function
        expect(Number(await this.tribe.balanceOf(secondUserAddress))).to.be.equal( (perBlockReward / 2)  * (advanceBlockAmount - 2));
    });

    it('should be able to step down rewards by halving rewards per block after 10 blocks, then go another 10 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }
        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.masterChief.harvest(pid, userAddress, { from: userAddress });

        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        await this.masterChief.updateBlockReward('50000000000000000000', { from: governorAddress });
        // burn tribe tokens to make life easier when calculating rewards after this step up
        await this.tribe.transfer(ONE_ADDRESS, (await this.tribe.balanceOf(userAddress)).toString());

        // we did 5 tx's before starting and then do 1 tx to harvest so start with i at 3.
        for (let i = 3; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        await this.masterChief.harvest(pid, userAddress, { from: userAddress });
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal( (perBlockReward / 2)  * (advanceBlockAmount));
    });

    it('should be able to step down rewards by creating a new PID with equal allocation points after 10 blocks, then go another 5 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward * advanceBlockAmount);

        await this.masterChief.harvest(pid, userAddress, { from: userAddress });

        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));

        // adding another PID will cut user rewards in half for users staked in the first pool
        await this.masterChief.add(allocationPoints, this.LPToken.address, ZERO_ADDRESS, { from: governorAddress });

        // burn tribe tokens to make life easier when calculating rewards after this step up
        await this.tribe.transfer(ONE_ADDRESS, (await this.tribe.balanceOf(userAddress)).toString());

        // we did 2 tx's before starting and then do 1 tx to harvest so start with i at 3.
        for (let i = 3; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        await this.masterChief.harvest(pid, userAddress, { from: userAddress });
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal( (perBlockReward / 2)  * (advanceBlockAmount));
    });

    it('should be able to get pending sushi after 10 blocks', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal(perBlockReward * advanceBlockAmount);
        
        await this.masterChief.harvest(pid, userAddress, { from: userAddress });
        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal(perBlockReward * (advanceBlockAmount + 1));
    });

    it('should be able to get pending sushi 10 blocks with 2 users staking', async function() {
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: secondUserAddress });

        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, secondUserAddress, { from: secondUserAddress });

        const advanceBlockAmount = 10;
        for (let i = 0; i < advanceBlockAmount; i++) {
            await time.advanceBlock();
        }

        expect(Number(await this.masterChief.pendingSushi(pid, userAddress))).to.be.equal( ( ( perBlockReward * advanceBlockAmount ) / 2 ) + perBlockReward );
        
        await this.masterChief.harvest(pid, secondUserAddress, { from: secondUserAddress });
        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(secondUserAddress))).to.be.equal( ( ( perBlockReward * advanceBlockAmount ) / 2 ) + perBlockReward / 2 );
        
        await this.masterChief.harvest(pid, userAddress, { from: userAddress });
        // add on one to the advance block amount as we have advanced one more block when calling the harvest function
        expect(Number(await this.tribe.balanceOf(userAddress))).to.be.equal( ( ( perBlockReward * advanceBlockAmount ) / 2 ) + perBlockReward * 2 );
    });

    async function printDebug(userOne, userTwo, userThree, masterChief) {
        console.log(`user1 balance: ${(await masterChief.pendingSushi(pid, userOne)).toString()}`);
        console.log(`user2 balance: ${(await masterChief.pendingSushi(pid, userTwo)).toString()}`);
        console.log(`user3 balance: ${(await masterChief.pendingSushi(pid, userThree)).toString()}\n`);
    }

    it('should be able to distribute sushi after 100 blocks with 3 users staking', async function() {
        // approve actions
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: userAddress });
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: secondUserAddress });
        await this.LPToken.approve(this.masterChief.address, totalStaked, { from: thirdUserAddress });

        // deposit actions
        await this.masterChief.deposit(pid, totalStaked, userAddress, { from: userAddress });
        await this.masterChief.deposit(pid, totalStaked, secondUserAddress, { from: secondUserAddress });
        await this.masterChief.deposit(pid, totalStaked, thirdUserAddress, { from: thirdUserAddress });

        let userOnePendingBalance = await this.masterChief.pendingSushi(pid, userAddress);
        let userTwoPendingBalance = await this.masterChief.pendingSushi(pid, secondUserAddress);
        let userThreePendingBalance = await this.masterChief.pendingSushi(pid, thirdUserAddress);

        const thirdIncrementAmount = new BN('33333333333400000000');
        const expectedIncrementAmount = new BN('33333333333300000000');
        const advanceBlockAmount = 100;

        for (let i = 1; i < advanceBlockAmount; i++) {            
            userOnePendingBalance = new BN(await this.masterChief.pendingSushi(pid, userAddress));
            userTwoPendingBalance = new BN(await this.masterChief.pendingSushi(pid, secondUserAddress));
            userThreePendingBalance = new BN(await this.masterChief.pendingSushi(pid, thirdUserAddress));

            await time.advanceBlock();

            let incrementAmount = (i % 3) === 0 ? thirdIncrementAmount : expectedIncrementAmount;
            expect(new BN(await this.masterChief.pendingSushi(pid, userAddress))).to.be.bignumber.equal(userOnePendingBalance.add(incrementAmount))
            expect(new BN(await this.masterChief.pendingSushi(pid, secondUserAddress))).to.be.bignumber.equal(userTwoPendingBalance.add(incrementAmount))
            expect(new BN(await this.masterChief.pendingSushi(pid, thirdUserAddress))).to.be.bignumber.equal(userThreePendingBalance.add(incrementAmount))
        }

        await this.masterChief.harvest(pid, userAddress, { from: userAddress });
        await this.masterChief.harvest(pid, secondUserAddress, { from: secondUserAddress });
        await this.masterChief.harvest(pid, thirdUserAddress, { from: thirdUserAddress });
    });

    async function testMultipleUsersPooling(masterChief, lpToken, userAddresses, incrementAmount, blocksToAdvance) {
        for (let i = 0; i < userAddresses.length; i++) {
            await lpToken.approve(masterChief.address, totalStaked, { from: userAddresses[i] });
            await masterChief.deposit(pid, totalStaked, userAddresses[i], { from: userAddresses[i] });
        }

        const pendingBalances = [];
        for (let i = 0; i < userAddresses.length; i++) {
            const balance = new BN(await masterChief.pendingSushi(pid, userAddresses[i]));
            pendingBalances.push(balance);
        }

        for (let i = 0; i < blocksToAdvance; i++) {
            for (let j = 0; j < pendingBalances.length; j++) {
                pendingBalances[j] = new BN(await masterChief.pendingSushi(pid, userAddresses[j]));
            }

            await time.advanceBlock();

            for (let j = 0; j < userAddresses.length; j++) {
                expect(pendingBalances[j].add(incrementAmount)).to.be.bignumber.equal(new BN(await masterChief.pendingSushi(pid, userAddresses[j])));
            }
        }
    }

    it('should be able to distribute sushi after 10 blocks with 5 users staking using helper function', async function() {
        const userAddresses = [ userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress, fifthUserAddress ];
        
        await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('20000000000000000000'), 10);
    });

    it('should be able to distribute sushi after 10 blocks with 4 users staking using helper function', async function() {
        const userAddresses = [ userAddress, secondUserAddress, thirdUserAddress, fourthUserAddress ];
        
        await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('25000000000000000000'), 10);
    });

    it('should be able to distribute sushi after 10 blocks with 2 users staking using helper function', async function() {
        const userAddresses = [ userAddress, secondUserAddress ];
        
        await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('50000000000000000000'), 10);
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
        
        await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('10000000000000000000'), 10);
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

        await this.masterChief.add(allocationPoints, this.LPToken.address, this.tribe.address, { from: governorAddress });
        expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
         
        await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('5000000000000000000'), 10);
    });

    it('should be able to assert poolLength', async function() {
        expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
    });
  });
});
