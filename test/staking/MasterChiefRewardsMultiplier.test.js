const {
    BN,
    expectEvent,
    expectRevert,
    expect,
    getCore,
    getAddresses,
    expectApprox,
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
    let forcedLock = false;
    let unlocked = false;
    // rewards multiplier by 10%
    const multiplier = new BN('1100000000000000000');
    // rewards multiplier by 10%
    const zeroMultiplier = new BN('1000000000000000000');
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
      } = await getAddresses(web3));
  
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
          multiplier,
          { from: governorAddress }
      );
      // grab PID from the logs
      pid = Number(tx.logs[0].args.pid);
      // grab the per block reward by calling the masterchief contract
      perBlockReward = Number(await this.masterChief.sushiPerBlock());
    });
  
  
    // this is a helper function to simplify the process of testing and asserting that users are receiving
    // the correct amount of rewards when they stake their LP tokens in the MasterChief contract.
    async function testMultipleUsersPooling(
        masterChief,
        lpToken,
        userAddresses,
        incrementAmount,
        blocksToAdvance,
        lockTokens // this is a boolean field specifying if the user wants to lock their tokens or not
    ) {
      for (let i = 0; i < userAddresses.length; i++) {
          await lpToken.approve(masterChief.address, totalStaked, { from: userAddresses[i] });
          await masterChief.deposit(
              pid,
              totalStaked,
              lockTokens,
              { from: userAddresses[i] }
          );
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
              expectApprox(pendingBalances[j].add(incrementAmount), new BN(await masterChief.pendingSushi(pid, userAddresses[j])));
          }
      }
    }
  
    describe('Governor Rewards Changes', function() {
        it('governor should be able to step down the pool multiplier, which unlocks users funds', async function() {
            const userAddresses = [ userAddress ];
            expect(
                (await this.masterChief.poolInfo(pid)).rewardMultiplier.toString()
            ).to.be.bignumber.equal(multiplier);
            // assert that this pool is locked
            expect(
                (await this.masterChief.poolInfo(pid)).unlocked
            ).to.be.false;
            await this.masterChief.governorChangeMultiplier(pid, zeroMultiplier, { from: governorAddress });
            // assert that this pool is now unlocked
            expect(
                (await this.masterChief.poolInfo(pid)).unlocked
            ).to.be.true;
            expect(
                (await this.masterChief.poolInfo(pid)).rewardMultiplier.toString()
            ).to.be.bignumber.equal(zeroMultiplier);
        });
    });

    describe('Test Pool with Force Lockup', function() {
        beforeEach(async function() {
            forcedLock = true;
            // create new reward stream

            const tx = await this.masterChief.add(
                allocationPoints,
                this.LPToken.address,
                ZERO_ADDRESS,
                lockupPeriod,
                forcedLock, // force users to lock their funds
                unlocked,
                multiplier,
                { from: governorAddress }
            );
            // grab PID from the logs
            pid = Number(tx.logs[0].args.pid);

            // set allocation points of earlier pool to 0 so that full block rewards are given out to this pool
            await this.masterChief.set(0, 0, ZERO_ADDRESS, false, { from: governorAddress });
            // set forcedlock back to false so that other tests will run just fine
            forcedLock = false;
        });

        it('should be able to get pending sushi and receive multiplier for depositing on force lock pool', async function() {
            const userAddresses = [ userAddress ];
            expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
            await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('110000000000000000000'), 10, false);
        });  

        it('should not be able to withdraw from a forced lock pool', async function() {
            const userAddresses = [ userAddress ];
    
            expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
            await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('110000000000000000000'), 5, false);
            await expectRevert(
                this.masterChief.withdraw(pid, totalStaked, userAddress, { from: userAddress }),
                "tokens locked"
            );
        });  

        it('should not be able to emergency withdraw from a forced lock pool', async function() {
            const userAddresses = [ userAddress ];
    
            expect(Number(await this.masterChief.poolLength())).to.be.equal(2);
            await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('110000000000000000000'), 5, false);
            await expectRevert(
                this.masterChief.emergencyWithdraw(pid, totalStaked, userAddress, { from: userAddress }),
                "tokens locked"
            );
        });  
    });

    describe('Test Rewards Multiplier', function() {
      it('should be able to get pending sushi and receive multiplier for locking', async function() {
          const userAddresses = [ userAddress ];
  
          expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
          await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('110000000000000000000'), 10, true);
      });
  
      it('should not be able to withdraw before locking period is over', async function() {
          const userAddresses = [ userAddress ];
  
          expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
          await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('110000000000000000000'), 3, true);
          await expectRevert(
            this.masterChief.withdraw(pid, totalStaked, userAddress, { from: userAddress }),
            "tokens locked"
          );
      });
  
      it('should not be able to emergency withdraw before locking period is over', async function() {
          const userAddresses = [ userAddress ];

          expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
          await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('110000000000000000000'), 3, true);
          await expectRevert(
            this.masterChief.emergencyWithdraw(pid, userAddress, { from: userAddress }),
            "tokens locked"
          );
      });
  
      it('should not be able to withdraw and harvest before locking period is over', async function() {
          const userAddresses = [ userAddress ];

          expect(Number(await this.masterChief.poolLength())).to.be.equal(1);
          await testMultipleUsersPooling(this.masterChief, this.LPToken, userAddresses, new BN('110000000000000000000'), 3, true);
          await expectRevert(
            this.masterChief.withdrawAndHarvest(pid, totalStaked, userAddress, { from: userAddress }),
            "tokens locked"
          );
      });
    });
});
