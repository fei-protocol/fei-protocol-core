const { use } = require('chai');
const {
    userAddress,
    secondUserAddress,
    minterAddress,
    governorAddress,
    BN,
    expectEvent,
    expectRevert,
    time,
    expect,
    Fei,
    Tribe,
    FeiStakingRewards,
    getCore
  } = require('../helpers');

  describe('EthBondingCurve', function () {

    beforeEach(async function () {
      
      this.core = await getCore(true);
      await this.core.init({from: governorAddress});
  
      this.fei = await Fei.at(await this.core.fei());
      this.tribe = await Tribe.at(await this.core.tribe());
        
      this.decimals = new BN('1000000000000000000');
      this.window = new BN('1000000000000000');

      this.rewardAmount = new BN('10').mul(this.decimals);
      this.stakedAmount = this.decimals;

      this.staking = await FeiStakingRewards.new(
          governorAddress, 
          this.tribe.address,
          this.fei.address,
          this.window
        );

      await this.fei.mint(userAddress, this.stakedAmount, {from: minterAddress});
      await this.fei.mint(secondUserAddress, this.stakedAmount.mul(new BN('10')), {from: minterAddress});

      await this.core.allocateTribe(this.staking.address, this.rewardAmount, {from: governorAddress});
    });
  
    describe('Init', function() {
    //   it('average price', async function() {
    //     expect((await this.bondingCurve.getAveragePrice('50000000'))[0]).to.be.equal('628090883348720719'); // about .63c
    //   });
  
    //   it('current price', async function() {
    //     expect((await this.bondingCurve.getCurrentPrice())[0]).to.be.equal('1000000000000000000000'); // .50c
    //   });
  
    //   it('getAmountOut', async function() {
    //     expect(await this.bondingCurve.getAmountOut('50000000')).to.be.bignumber.equal(new BN('39803156936'));
    //   });
  
    //   it('scale', async function() {
    //       expect(await this.bondingCurve.scale()).to.be.bignumber.equal(this.scale);
    //       expect(await this.bondingCurve.atScale()).to.be.equal(false);
    //   });
  
    //   it('getTotalPCVHeld', async function() {
    //     expect(await this.bondingCurve.getTotalPCVHeld()).to.be.bignumber.equal(new BN('0'));
    //   });
  
    //   it('totalPurchased', async function() {
    //     expect(await this.bondingCurve.totalPurchased()).to.be.bignumber.equal(new BN('0'));
    //   });
  
    //   it('buffer', async function() {
    //     expect(await this.bondingCurve.buffer()).to.be.bignumber.equal(this.buffer);
    //     expect(await this.bondingCurve.BUFFER_GRANULARITY()).to.be.bignumber.equal('10000');
    //   });
  
    //   it('incentive amount', async function() {
    //     expect(await this.bondingCurve.incentiveAmount()).to.be.bignumber.equal(this.incentiveAmount);
    //   });
    });

    describe('Test', function() {
        beforeEach(async function() {
            await this.staking.notifyRewardAmount(this.rewardAmount, {from: governorAddress});
            
            await this.fei.approve(this.staking.address, this.stakedAmount, {from: userAddress});
            await this.fei.approve(this.staking.address, this.stakedAmount.mul(new BN('100')), {from: secondUserAddress});

            await this.staking.stake(this.stakedAmount, {from: userAddress});

        });

        it('earns rewards', async function() {
            await this.staking.stake(this.stakedAmount.mul(new BN('4')), {from: secondUserAddress});
            await this.staking.stake(this.stakedAmount.mul(new BN('5')), {from: secondUserAddress});

            await time.increase(this.window.div(new BN('4')));
            await this.staking.exit({from: secondUserAddress});

            await time.increase(this.window.div(new BN('2')));
            // expect(await this.staking.earned(userAddress)).to.be.bignumber.equal(this.rewardAmount);
            await this.staking.stake(this.stakedAmount.mul(new BN('9')), {from: secondUserAddress});
            
            await time.increase(this.window.div(new BN('4')));

            await this.staking.exit({from: secondUserAddress});
            expect(await this.staking.earned(userAddress)).to.be.bignumber.equal(this.rewardAmount);

            await this.staking.exit({from: userAddress});
            expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal(this.rewardAmount);
            // expect(await this.staking.earned(userAddress)).to.be.bignumber.equal();
            // expect(await this.staking.earned(userAddress)).to.be.bignumber.equal(this.rewardAmount.div(new BN('10')));


            await time.increase(this.window);
        });
    });
});
  