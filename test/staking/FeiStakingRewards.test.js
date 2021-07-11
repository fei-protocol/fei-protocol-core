const {
  BN,
  expectEvent,
  expectRevert,
  time,
  expect,
  expectApprox,
  getAddresses,
  getCore,
} = require('../helpers');

const Fei = artifacts.require('Fei');
const Tribe = artifacts.require('Tribe');
const FeiStakingRewards = artifacts.require('FeiStakingRewards');
const MockERC20 = artifacts.require('MockERC20');

describe('FeiStakingRewards', function () {
  let userAddress;
  let secondUserAddress;
  let minterAddress;
  let governorAddress;

  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      minterAddress,
      governorAddress,
    } = await getAddresses());
    this.core = await getCore(true);

    this.fei = await Fei.at(await this.core.fei());
    this.tribe = await Tribe.at(await this.core.tribe());

    this.decimals = new BN('1000000000000000000');
    this.window = new BN('1000000');

    this.rewardAmount = new BN('100000000').mul(this.decimals);
    this.stakedAmount = this.decimals;

    this.staking = await FeiStakingRewards.new(
      governorAddress, 
      this.tribe.address,
      this.fei.address, // Using FEI instead of LP tokens for simplicity
      this.window
    );

    await this.fei.mint(userAddress, this.stakedAmount, {from: minterAddress});
    await this.fei.mint(secondUserAddress, this.stakedAmount.mul(new BN('10')), {from: minterAddress});
    
    await this.core.allocateTribe(this.staking.address, this.rewardAmount, {from: governorAddress});
  });

  describe('Init', function() {
    it('rewardsToken', async function() {
      expect(await this.staking.rewardsToken()).to.be.equal(this.tribe.address);
    });

    it('current price', async function() {
      expect(await this.staking.stakingToken()).to.be.equal(this.fei.address);
    });

    it('periodFinish', async function() {
      expect(await this.staking.periodFinish()).to.be.bignumber.equal(new BN('0'));
    });

    it('rewardRate', async function() {
      expect(await this.staking.rewardRate()).to.be.bignumber.equal(new BN('0'));
    });

    it('rewardsDuration', async function() {
      expect(await this.staking.rewardsDuration()).to.be.bignumber.equal(this.window);
    });

    it('lastUpdateTime', async function() {
      expect(await this.staking.lastUpdateTime()).to.be.bignumber.equal(new BN('0'));
    });

    it('rewardPerTokenStored', async function() {
      expect(await this.staking.rewardPerTokenStored()).to.be.bignumber.equal(new BN('0'));
    });

    it('totalSupply', async function() {
      expect(await this.staking.totalSupply()).to.be.bignumber.equal(new BN('0'));
    });

    it('getRewardForDuration', async function() {
      expect(await this.staking.getRewardForDuration()).to.be.bignumber.equal(new BN('0'));
    });
  });

  describe('notifyRewardAmount', function() {
    describe('non-owner', function() {
      it('reverts', async function() {
        await expectRevert(this.staking.notifyRewardAmount(this.rewardAmount, {from: userAddress}), 'Caller is not RewardsDistribution contract');
      });
    });
    describe('too much notified', function() {
      it('reverts', async function() {
        await expectRevert(this.staking.notifyRewardAmount(this.rewardAmount.mul(new BN('2')), {from: governorAddress}), 'Provided reward too high');
      });
    });

    describe('full amount', function() {
      beforeEach(async function() {
        expectEvent(
          await this.staking.notifyRewardAmount(this.rewardAmount, {from: governorAddress}), 
          'RewardAdded',
          {
            reward: this.rewardAmount,
          }
        );
      });
      it('rewardPerToken', async function() {
        expect(await this.staking.rewardPerTokenStored()).to.be.bignumber.equal(new BN('0'));
      });

      it('rewardRate', async function() {
        expect(await this.staking.rewardRate()).to.be.bignumber.equal(new BN('100000000000000000000'));
      });
    });

    describe('half', function() {
      beforeEach(async function() {
        this.notifiedAmount = this.rewardAmount.div(new BN('2'));
        expectEvent(
          await this.staking.notifyRewardAmount(this.notifiedAmount, {from: governorAddress}), 
          'RewardAdded',
          {
            reward: this.notifiedAmount,
          }
        );
      });
      it('rewardPerToken', async function() {
        expect(await this.staking.rewardPerTokenStored()).to.be.bignumber.equal(new BN('0'));
      });

      it('rewardRate', async function() {
        expect(await this.staking.rewardRate()).to.be.bignumber.equal(new BN('50000000000000000000'));
      });

      describe('second half', function() {
        beforeEach(async function() {
          this.notifiedAmount = this.rewardAmount.div(new BN('2'));
          expectEvent(
            await this.staking.notifyRewardAmount(this.notifiedAmount, {from: governorAddress}), 
            'RewardAdded',
            {
              reward: this.notifiedAmount,
            }
          );
        });
        it('rewardPerToken', async function() {
          expect(await this.staking.rewardPerTokenStored()).to.be.bignumber.equal(new BN('0'));
        });
  
        it('rewardRate', async function() {
          expect(await this.staking.rewardRate(), new BN('100000000000000000000'));
        });
      });
    });
  });

  describe('recoverERC20', function() {
    describe('non-owner', function() {
      it('reverts', async function() {
        await expectRevert(this.staking.recoverERC20(this.tribe.address, userAddress, this.rewardAmount, {from: userAddress}), 'Caller is not RewardsDistribution contract');
      });
    });
    describe('invalid token', function() {
      it('rewards reverts', async function() {
        await expectRevert(this.staking.recoverERC20(this.tribe.address, governorAddress, this.rewardAmount, {from: governorAddress}), 'Cannot withdraw the rewards token');
      });

      it('staking reverts', async function() {
        await expectRevert(this.staking.recoverERC20(this.fei.address, governorAddress, this.rewardAmount, {from: governorAddress}), 'Cannot withdraw the staking token');
      });
    });

    describe('full amount', function() {
      beforeEach(async function() {
        this.token = await MockERC20.new();
        await this.token.mint(this.staking.address, this.stakedAmount);
        expectEvent(
          await this.staking.recoverERC20(this.token.address, governorAddress, this.stakedAmount, {from: governorAddress}), 
          'Recovered',
          {
            amount: this.stakedAmount,
          }
        );
      });

      it('succeeds', async function() {
        expect(await this.token.balanceOf(this.staking.address)).to.be.bignumber.equal(new BN('0'));
      });
    });
  });

  describe('stake', function() {
    beforeEach(async function() {
      await this.staking.notifyRewardAmount(this.rewardAmount, {from: governorAddress});
          
      await this.fei.approve(this.staking.address, this.stakedAmount, {from: userAddress});
      await this.fei.approve(this.staking.address, this.stakedAmount.mul(new BN('100')), {from: secondUserAddress});
    });

    describe('alone from start', async function() {
      beforeEach(async function() {
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window);
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount);
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('0'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('0'));
      });
    });

    describe('alone from halfway', async function() {
      beforeEach(async function() {
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window.div(new BN('2')));
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount.div(new BN('2')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
      });

      it('updates rates', async function() {
        expect(await this.staking.rewardPerTokenStored()).to.be.bignumber.equal(new BN('0'));
        expect(await this.staking.userRewardPerTokenPaid(userAddress)).to.be.bignumber.equal(new BN('0'));
      });
    });

    describe('second from start 50/50', async function() {
      beforeEach(async function() {
        await this.staking.stake(this.stakedAmount, {from: secondUserAddress});

        expect(await this.staking.rewardPerTokenStored()).to.be.bignumber.equal(new BN('0'));
        expect(await this.staking.userRewardPerTokenPaid(userAddress)).to.be.bignumber.equal(new BN('0'));

        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
            
        await time.increase(this.window);
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount.div(new BN('2')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount.mul(new BN('2')));
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
      });

      it('updates rates', async function() {
        expect(await this.staking.rewardPerTokenStored()).to.be.bignumber.equal(new BN('100000000000000000000'));
        expect(await this.staking.userRewardPerTokenPaid(userAddress)).to.be.bignumber.equal(new BN('100000000000000000000'));
      });
    });

    describe('second from halfway 50/50', async function() {
      beforeEach(async function() {
        await this.staking.stake(this.stakedAmount, {from: secondUserAddress}),
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window.div(new BN('2')));
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount.div(new BN('4')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount.mul(new BN('2')));
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('50000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('50000000000000000000000000'));
      });
    });
  });

  describe('withdraw', function() {
    beforeEach(async function() {
      await this.staking.notifyRewardAmount(this.rewardAmount, {from: governorAddress});
          
      await this.fei.approve(this.staking.address, this.stakedAmount, {from: userAddress});
      await this.fei.approve(this.staking.address, this.stakedAmount.mul(new BN('100')), {from: secondUserAddress});
    });

    describe('alone from start', async function() {
      beforeEach(async function() {
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window);
        expectEvent(
          await this.staking.withdraw(this.stakedAmount, {from: userAddress}),
          'Withdrawn',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.rewards(userAddress), this.rewardAmount);
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount);
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(new BN('0'));
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('100000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('100000000000000000000000000'));
      });
    });

    describe('alone from halfway', async function() {
      beforeEach(async function() {
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.withdraw(this.stakedAmount, {from: userAddress}),
          'Withdrawn',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.rewards(userAddress), this.rewardAmount.div(new BN('2')));
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount.div(new BN('2')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(new BN('0'));
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('50000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('50000000000000000000000000'));
      });
    });

    describe('second from start 50/50', async function() {
      beforeEach(async function() {
        await this.staking.stake(this.stakedAmount, {from: secondUserAddress});
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window);
        expectEvent(
          await this.staking.withdraw(this.stakedAmount, {from: userAddress}),
          'Withdrawn',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.rewards(userAddress), this.rewardAmount.div(new BN('2')));
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount.div(new BN('2')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('50000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('50000000000000000000000000'));
      });
    });

    describe('second from halfway 50/50', async function() {
      beforeEach(async function() {
        await this.staking.stake(this.stakedAmount, {from: secondUserAddress}),
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.withdraw(this.stakedAmount, {from: userAddress}),
          'Withdrawn',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.rewards(userAddress), this.rewardAmount.div(new BN('4')));
        await expectApprox(await this.staking.earned(userAddress), this.rewardAmount.div(new BN('4')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('75000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('75000000000000000000000000'));
      });
    });
  });

  describe('exit', function() {
    beforeEach(async function() {
      await this.staking.notifyRewardAmount(this.rewardAmount, {from: governorAddress});
          
      await this.fei.approve(this.staking.address, this.stakedAmount, {from: userAddress});
      await this.fei.approve(this.staking.address, this.stakedAmount.mul(new BN('100')), {from: secondUserAddress});
    });

    describe('alone from start', async function() {
      beforeEach(async function() {
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window);
        expectEvent(
          await this.staking.exit({from: userAddress}),
          'RewardPaid',
          {
            user: userAddress,
          }
        );
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.rewards(userAddress), new BN('0'));
        await expectApprox(await this.staking.earned(userAddress), new BN('0'));
        await expectApprox(await this.tribe.balanceOf(userAddress), this.rewardAmount);
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(new BN('0'));
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('100000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('100000000000000000000000000'));
      });
    });

    describe('alone from halfway', async function() {
      beforeEach(async function() {
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.exit({from: userAddress}),
          'RewardPaid',
          {
            user: userAddress,
          }
        );
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.rewards(userAddress), new BN('0'));
        await expectApprox(await this.staking.earned(userAddress), new BN('0'));
        await expectApprox(await this.tribe.balanceOf(userAddress), this.rewardAmount.div(new BN('2')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(new BN('0'));
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expect(await this.staking.rewardPerTokenStored(), new BN('50000000000000000000000000'));
        await expect(await this.staking.userRewardPerTokenPaid(userAddress), new BN('50000000000000000000000000'));
      });
    });

    describe('second from start 50/50', async function() {
      beforeEach(async function() {
        await this.staking.stake(this.stakedAmount, {from: secondUserAddress});
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window);
        expectEvent(
          await this.staking.exit({from: userAddress}),
          'RewardPaid',
          {
            user: userAddress,
          }
        );
      });

      it('earns rewards', async function() {
        await expectApprox(await this.staking.rewards(userAddress), new BN('0'));
        await expectApprox(await this.staking.earned(userAddress), new BN('0'));
        await expectApprox(await this.tribe.balanceOf(userAddress), this.rewardAmount.div(new BN('2')));
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('50000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('50000000000000000000000000'));
      });
    });

    describe('second from halfway 50/50', async function() {
      beforeEach(async function() {
        await this.staking.stake(this.stakedAmount, {from: secondUserAddress}),
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.stake(this.stakedAmount, {from: userAddress}),
          'Staked',
          {
            user: userAddress,
            amount: this.stakedAmount
          }
        );
        await time.increase(this.window.div(new BN('2')));
        expectEvent(
          await this.staking.exit({from: userAddress}),
          'RewardPaid',
          {
            user: userAddress,
          }
        );
      });

      it('earns rewards', async function() {
        expect(await this.staking.rewards(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.staking.earned(userAddress)).to.be.bignumber.equal(new BN('0'));
        await expectApprox(await this.tribe.balanceOf(userAddress), this.rewardAmount.div(new BN('4')), 6);
      });

      it('updated balances', async function() {
        expect(await this.staking.totalSupply()).to.be.bignumber.equal(this.stakedAmount);
        expect(await this.staking.balanceOf(userAddress)).to.be.bignumber.equal(new BN('0'));
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.stakedAmount);
      });

      it('updates rates', async function() {
        await expectApprox(await this.staking.rewardPerTokenStored(), new BN('75000000000000000000000000'));
        await expectApprox(await this.staking.userRewardPerTokenPaid(userAddress), new BN('75000000000000000000000000'), 6);
      });
    });
  });
});
