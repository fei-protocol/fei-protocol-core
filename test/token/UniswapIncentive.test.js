const {
  userAddress,
  minterAddress,
  governorAddress,
  BN,
  expectEvent,
  expectRevert,
  time,
  expect,
  Fei,
  UniswapIncentive,
  MockPair,
  MockOracle,
  MockERC20,
  getCore
} = require('../helpers');

describe('UniswapIncentive', function () {

  beforeEach(async function () {

    this.core = await getCore(true);
    
    this.fei = await Fei.at(await this.core.fei());
    this.oracle = await MockOracle.new(500); // 500:1 USD/ETH exchange rate

    this.token = await MockERC20.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);

    this.incentive = await UniswapIncentive.new(this.core.address, this.oracle.address, this.pair.address, this.pair.address, 333);

    await this.core.grantMinter(this.incentive.address, {from: governorAddress});
    await this.core.grantBurner(this.incentive.address, {from: governorAddress});
    await this.fei.setIncentiveContract(this.pair.address, this.incentive.address, {from: governorAddress});
    
    await this.fei.mint(userAddress, 50000000, {from: minterAddress});
    this.userBalance = new BN(50000000);

    await this.fei.mint(this.pair.address, 5000000, {from: minterAddress});
    this.pairBalance = new BN(5000000);

  });

  describe('Incentive Parity', function() {
    describe('Above Peg', function() {
      beforeEach(async function() {
        await this.pair.setReserves(100000, 49000000);
      });
      describe('Inactive Time Weight', function() {
        beforeEach(async function() {
          await this.incentive.setTimeWeight(0, 100000, false, {from: governorAddress});
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
        });
        it('returns false', async function() {
          expect(await this.incentive.isIncentiveParity()).to.be.equal(false);
        });
      });
      describe('Active Time Weight', function() {
        beforeEach(async function() {
          await this.incentive.setTimeWeight(0, 100000, true, {from: governorAddress});
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
        });
        it('returns false', async function() {
          expect(await this.incentive.isIncentiveParity()).to.be.equal(false);
        });
      });
    });
    describe('At Peg', function() {
      beforeEach(async function() {
        await this.pair.setReserves(100000, 50000000);
      });

      describe('Inactive Time Weight', function() {
        beforeEach(async function() {
          await this.incentive.setTimeWeight(0, 100000, false, {from: governorAddress});
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
        });
        it('returns false', async function() {
          expect(await this.incentive.isIncentiveParity()).to.be.equal(false);
        });
      });

      describe('Active Time Weight', function() {
        beforeEach(async function() {
          await this.incentive.setTimeWeight(0, 100000, true, {from: governorAddress});
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
        });
        it('returns false', async function() {
          expect(await this.incentive.isIncentiveParity()).to.be.equal(false);
        });
      });
    });

    describe('Below Peg', function() {
      beforeEach(async function() {
        await this.pair.setReserves(100000, 51000000);
      });
      describe('Inactive Time Weight', function() {
        beforeEach(async function() {
          await this.incentive.setTimeWeight(0, 100000, false, {from: governorAddress});
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
        });
        it('returns false', async function() {
          expect(await this.incentive.isIncentiveParity()).to.be.equal(false);
        });
      });

      describe('Active Time Weight', function() {
        // at 2% deviation, w=2 is parity
        describe('Below Parity', function() {
          beforeEach(async function() {
            // w=1
            await this.incentive.setTimeWeight(0, 100000, true, {from: governorAddress});
            await time.advanceBlock();
          });
          it('returns false', async function() {
            expect(await this.incentive.methods['isIncentiveParity()'].call()).to.be.equal(false);
          });
        });

        describe('At Parity', function() {
          beforeEach(async function() {
            await this.incentive.setTimeWeight(0, 200000, true, {from: governorAddress});
            await time.advanceBlock();
          });
          it('returns true', async function() {
            expect(await this.incentive.methods['isIncentiveParity()'].call()).to.be.equal(true);
          });
        });

        describe('Exceeds Parity', function() {
          beforeEach(async function() {
            await this.incentive.setTimeWeight(0, 400000, true, {from: governorAddress});
            await time.advanceBlock();
          });
          it('returns true', async function() {
            expect(await this.incentive.methods['isIncentiveParity()'].call()).to.be.equal(true);
          });
        });
      });
    });
  });

  describe('Time Weight', function() {
    it('granularity', async function() {
        expect(await this.incentive.TIME_WEIGHT_GRANULARITY()).to.be.bignumber.equal(new BN(100000));
    });

    describe('calculation', function() {
      it('inactive', async function() {
        let block = await time.latestBlock();
        expectEvent(
          await this.incentive.setTimeWeight(0, 100000, false, {from: governorAddress}),
          'TimeWeightUpdate',
          {
            _weight: '0',
            _active: false
          }
        );
        expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
      });

      it('default same block', async function() {
        expectEvent(
          await this.incentive.setTimeWeight(0, 333, true, {from: governorAddress}),
          'TimeWeightUpdate',
          {
            _weight: '0',
            _active: true
          }
        );
        expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
      });

      it('default future block', async function() {
        expectEvent(
          await this.incentive.setTimeWeight(0, 333, true, {from: governorAddress}),
          'TimeWeightUpdate',
          {
            _weight: '0',
            _active: true
          }
        );
        await time.advanceBlock();
        await time.advanceBlock();
        await time.advanceBlock();
        expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(999));
      });

      it('custom growth rate same block', async function() {
        expectEvent(
          await this.incentive.setTimeWeight( 0, 1000, true, {from: governorAddress}),
          'TimeWeightUpdate',
          {
            _weight: '0',
            _active: true
          }
        );
        expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
      });

      it('custom growth rate future block', async function() {
        expectEvent(
          await this.incentive.setTimeWeight(0, 1000, true, {from: governorAddress}),
          'TimeWeightUpdate',
          {
            _weight: '0',
            _active: true
          }
        );
        await time.advanceBlock();
        await time.advanceBlock();
        await time.advanceBlock();
        expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(3000));
      });
    });
  });

  describe('Self sell', function() {
    it('reverts', async function() {
      await expectRevert(this.pair.withdrawFei(this.pair.address, 1000000), "UniswapIncentive: cannot send self");
    });
  });

  describe('At peg', function() {
    beforeEach(async function() {
      await this.pair.setReserves(100000, 50000000);
    });

    describe('Buy', function() {
      beforeEach(async function() {
        await this.pair.withdrawFei(userAddress, 1000000);
      });

      it('user balance updates', async function() {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(1000000).add(this.userBalance));
      });

      it('pair balance updates', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(new BN(1000000)));
      });

      it('no incentive', async function() {
        var user = await this.fei.balanceOf(userAddress);
        var pair = await this.fei.balanceOf(this.pair.address);

        expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(new BN(0));
      });

      it('time weight stays inactive', async function() {
        expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
        expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(333));
        expect(await this.incentive.isTimeWeightActive()).to.be.equal(false);
      });
    });

    describe('Sell', function() {

      describe('enough in wallet', function() {
        beforeEach(async function() {
          this.expectedBurn = new BN(6672); // with rounding error
          await this.fei.transfer(this.pair.address, 500000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(new BN(500000)));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(new BN(500000)).sub(this.expectedBurn));
        });

        it('burn incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });

        it('activates time weight', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(333));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('exceeds transfer size', function() {
        it('reverts', async function() {
          await expectRevert(this.fei.transfer(this.pair.address, 10000000, {from: userAddress}), "UniswapIncentive: Burn exceeds trade size");
        });
      });
    });
  });

  describe('Above peg', function() {
    beforeEach(async function() {
      // 490 FEI/ETH = 2% away
      await this.pair.setReserves(100000, 49000000);
    });

    describe('Buy', function() {

      beforeEach(async function() {
        await this.pair.withdrawFei(userAddress, 1000000);
      });

      it('user balance updates', async function() {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(1000000).add(this.userBalance));
      });

      it('pair balance updates', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(new BN(1000000)));
      });

      it('no incentive', async function() {
        var user = await this.fei.balanceOf(userAddress);
        var pair = await this.fei.balanceOf(this.pair.address);

        expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(new BN(0));
      });
    });

    describe('Sell', function() {
      describe('short of peg', function() {
        beforeEach(async function() {
          // No expected burn
          await this.fei.transfer(this.pair.address, 100000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(new BN(100000)));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(new BN(100000)));
        });

        it('no incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(new BN(0));
        });

        it('time weight stays inactive', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(333));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(false);
        });
      });

      describe('to peg', function() {
        beforeEach(async function() {
          // No expected burn
          this.transferAmount = new BN(497445);
          await this.fei.transfer(this.pair.address, 497445, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount));
        });

        it('no incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(new BN(0));
        });

        it('time weight stays inactive', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(333));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(false);
        });
      });

      describe('past the peg', function() {
        describe('enough in wallet', function() {
          beforeEach(async function() {
            this.expectedBurn = new BN(6906);
            this.transferAmount = new BN(1000000);
            await this.fei.transfer(this.pair.address, 1000000, {from: userAddress});
          });

          it('user balance updates', async function() {
            expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount));
          });

          it('pair balance updates', async function() {
            expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount).sub(this.expectedBurn));
          });

          it('burn incentive', async function() {
            var user = await this.fei.balanceOf(userAddress);
            var pair = await this.fei.balanceOf(this.pair.address);

            expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
          });

          it('activates time weight', async function() {
            expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
            expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(333));
            expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
          });
        });

        describe('beyond trade size', function() {
          it('reverts', async function() {
            await expectRevert(this.fei.transfer(this.pair.address, 10000000, {from: userAddress}), "UniswapIncentive: Burn exceeds trade size");
          });
        });
      });
    });
  });

  describe('Below peg', function() {
    beforeEach(async function() {
      // 510 FEI/ETH = 2% away
      await this.pair.setReserves(100000, 51000000);
      let block = await time.latestBlock();
      // Set growth rate to 1 per block, starting at next block (the block preceeding the withdrawal)
      await this.incentive.setTimeWeight(0, 25000, true, {from: governorAddress});
    });

    describe('Buy', function() {
      describe('not a minter', function() {
        beforeEach(async function() {
          await this.core.revokeMinter(this.incentive.address, {from: governorAddress});
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(0);
          await this.pair.withdrawFei(userAddress, 502500);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('no incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('time weight stays active', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(50000));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('exempt user', function() {
        beforeEach(async function() {
          await this.incentive.setExemptAddress(userAddress, true, {from: governorAddress});
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(0);
          await this.pair.withdrawFei(userAddress, 502500);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('no incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('time weight stays active', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(50000));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('to peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(2512);
          await this.pair.withdrawFei(userAddress, 502500);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('resets time weight', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(false);
        });
      });

      describe('past peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(1000000);
          this.expectedMint = new BN(2512); // should be same as to peg
          await this.pair.withdrawFei(userAddress, 1000000);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('resets time weight', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(false);
        });
      });

      describe('short of peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(100000);
          this.expectedMint = new BN(500);
          await this.pair.withdrawFei(userAddress, 100000);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('partially updates time weight', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(20010));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('double time weight', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(5024);
          await time.advanceBlock();
          await this.pair.withdrawFei(userAddress, 502500);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('resets time weight', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(false);
        });
      });

      describe('double time weight short of peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(100000);
          this.expectedMint = new BN(1000);
          await time.advanceBlock();
          await this.pair.withdrawFei(userAddress, 100000);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('partially updates time weight', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(40021));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('time weight exceeds burn', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(6632);
          await time.advanceBlock();
          await time.advanceBlock();
          await time.advanceBlock();
          await this.pair.withdrawFei(userAddress, 502500);
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });

        it('resets time weight', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(0));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(false);
        });
      });
    });

    describe('Sell', function() {
      describe('not a burner', function() {
        beforeEach(async function() {
          await this.core.revokeBurner(this.incentive.address, {from: governorAddress});
          this.expectedBurn = new BN(0);
          this.transferAmount = new BN(1000000);
          await this.fei.transfer(this.pair.address, 1000000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount).sub(this.expectedBurn));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount));
        });

        it('burn incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });

        it('time weight stays active', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(50000));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('exempt user', function() {
        beforeEach(async function() {
          await this.incentive.setExemptAddress(userAddress, true, {from: governorAddress});
          this.expectedBurn = new BN(0);
          this.transferAmount = new BN(1000000);
          await this.fei.transfer(this.pair.address, 1000000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount).sub(this.expectedBurn));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount));
        });

        it('burn incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });

        it('time weight stays active', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(50000));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('enough in wallet', function() {
        beforeEach(async function() {
          this.expectedBurn = new BN(173463);
          this.transferAmount = new BN(1000000);
          await this.fei.transfer(this.pair.address, 1000000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount).sub(this.expectedBurn));
        });

        it('burn incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });

        it('time weight updates', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('time weight too high', function() {
        beforeEach(async function() {
          this.expectedBurn = new BN(4806);
          this.transferAmount = new BN(100000);
          for (let i = 0; i < 20; i++) {
            await time.advanceBlock();
          }

          await this.fei.transfer(this.pair.address, 100000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount).sub(this.expectedBurn));
        });

        it('burn incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });

        it('time weight update capped', async function() {
          expect(await this.incentive.getTimeWeight()).to.be.bignumber.equal(new BN(240070));
          expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(25000));
          expect(await this.incentive.isTimeWeightActive()).to.be.equal(true);
        });
      });

      describe('burn exceeds trade', function() {
        it('reverts', async function() {
          await expectRevert(this.fei.transfer(this.pair.address, 10000000, {from: userAddress}), "UniswapIncentive: Burn exceeds trade size");
        });
      });
    });
  });

  describe('Access', function () {
    describe('Incentivize', function() {
      it('Non-Fei call reverts', async function() {
        await expectRevert(this.incentive.incentivize(this.pair.address, userAddress, userAddress, 1000000), "CoreRef: Caller is not FEI");
      });
    });

    describe('Growth Rate', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.incentive.setTimeWeightGrowth(1000, {from: governorAddress}),
          'GrowthRateUpdate',
          {_growthRate: '1000'}
        );
        expect(await this.incentive.getGrowthRate()).to.be.bignumber.equal(new BN(1000));
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setTimeWeightGrowth(1000, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Oracle', function() {
      it('Governor set succeeds', async function() {
        await this.incentive.setOracle(this.oracle.address, {from: governorAddress});
        expect(await this.incentive.oracle()).to.be.equal(this.oracle.address);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setOracle(this.oracle.address, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });

    describe('Exempt Addresses', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.incentive.setExemptAddress(userAddress, true, {from: governorAddress}),
          'ExemptAddressUpdate',
          {
            _account: userAddress,
            _isExempt: true
          }
        );
        expect(await this.incentive.isExemptAddress(userAddress)).to.be.equal(true);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setExemptAddress(userAddress, true, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});