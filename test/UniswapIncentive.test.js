const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Fei = contract.fromArtifact('Fei');
const Core = contract.fromArtifact('Core');
const UniswapIncentive = contract.fromArtifact('UniswapIncentive');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockOracle = contract.fromArtifact('MockOracle');
const MockERC20 = contract.fromArtifact('MockERC20');

describe('UniswapIncentive', function () {
  const [ userAddress, minterAddress, governorAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({gas: 8000000, from: governorAddress});
    this.fei = await Fei.at(await this.core.fei());
    this.incentive = await UniswapIncentive.new(this.core.address);
    this.token = await MockERC20.new();
    this.pair = await MockPair.new(this.token.address, this.fei.address);
    this.oracle = await MockOracle.new(500); // 500:1 USD/ETH exchange rate

    await this.core.grantMinter(this.incentive.address, {from: governorAddress});
    await this.core.grantBurner(this.incentive.address, {from: governorAddress});
    await this.core.grantMinter(minterAddress, {from: governorAddress});
    await this.fei.setIncentiveContract(this.pair.address, this.incentive.address, {from: governorAddress});
    await this.fei.mint(userAddress, 50000000, {from: minterAddress});
    await this.incentive.setOracleForPair(this.pair.address, this.oracle.address, {from: governorAddress});

    this.userBalance = new BN(50000000);
    await this.fei.mint(this.pair.address, 50000000, {from: minterAddress});
    this.pairBalance = new BN(50000000);
  });

  describe('Incentive Parity', function() {
    describe('Above Peg', function() {
      beforeEach(async function() {
        await this.pair.setReserves(100000, 49000000);
      });
      describe('Inactive Time Weight', function() {
        beforeEach(async function() {
          let block = await time.latestBlock();
          await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(5)), 0, 100000, false, {from: governorAddress});
        });
        it('reverts', async function() {
          await expectRevert(this.incentive.isIncentiveParity(this.pair.address), "UniswapIncentive: Incentive zero or not active");
        });
      });
      describe('Active Time Weight', function() {
        beforeEach(async function() {
          let block = await time.latestBlock();
          await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(5)), 0, 100000, true, {from: governorAddress});
        });
        it('reverts', async function() {
          await expectRevert(this.incentive.isIncentiveParity(this.pair.address), "UniswapIncentive: Price already at or above peg");
        });
      });
    });
    describe('At Peg', function() {
      beforeEach(async function() {
        await this.pair.setReserves(100000, 50000000);
      });

      describe('Inactive Time Weight', function() {
        beforeEach(async function() {
          let block = await time.latestBlock();
          await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(5)), 0, 100000, false, {from: governorAddress});
        });
        it('reverts', async function() {
          await expectRevert(this.incentive.isIncentiveParity(this.pair.address), "UniswapIncentive: Incentive zero or not active");
        });
      });

      describe('Active Time Weight', function() {
        beforeEach(async function() {
          let block = await time.latestBlock();
          await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(5)), 0, 100000, true, {from: governorAddress});
        });
        it('reverts', async function() {
          await expectRevert(this.incentive.isIncentiveParity(this.pair.address), "UniswapIncentive: Price already at or above peg");
        });
      });
    });

    describe('Below Peg', function() {
      beforeEach(async function() {
        await this.pair.setReserves(100000, 51000000);
      });
      describe('Inactive Time Weight', function() {
        beforeEach(async function() {
          let block = await time.latestBlock();
          await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(5)), 0, 100000, false, {from: governorAddress});
        });
        it('reverts', async function() {
          await expectRevert(this.incentive.isIncentiveParity(this.pair.address), "UniswapIncentive: Incentive zero or not active");
        });
      });

      describe('Active Time Weight', function() {
        // at 2% deviation, w=2 is parity
        describe('Below Parity', function() {
          beforeEach(async function() {
            let block = await time.latestBlock();
            // w=1
            await this.incentive.setTimeWeight(this.pair.address, block, 0, 100000, true, {from: governorAddress});
          });
          it('returns false', async function() {
            expect(await this.incentive.methods['isIncentiveParity(address)'].call(this.pair.address)).to.be.equal(false);
          });
        });

        describe('At Parity', function() {
          beforeEach(async function() {
            let block = await time.latestBlock();
            // w=2
            await this.incentive.setTimeWeight(this.pair.address, block, 0, 200000, true, {from: governorAddress});
          });
          it('returns true', async function() {
            expect(await this.incentive.methods['isIncentiveParity(address)'].call(this.pair.address)).to.be.equal(true);
          });
        });

        describe('Exceeds Parity', function() {
          beforeEach(async function() {
            let block = await time.latestBlock();
            // w=4
            await this.incentive.setTimeWeight(this.pair.address, block, 0, 400000, true, {from: governorAddress});
          });
          it('returns true', async function() {
            expect(await this.incentive.methods['isIncentiveParity(address)'].call(this.pair.address)).to.be.equal(true);
          });
        });
      });
    });
  });

  describe('Time Weight', function() {
    it('granularity', async function() {
        expect(await this.incentive.TIME_WEIGHT_GRANULARITY()).to.be.bignumber.equal(new BN(100000));
    });
    it('default growth rate', async function() {
        expect(await this.incentive.DEFAULT_INCENTIVE_GROWTH_RATE()).to.be.bignumber.equal(new BN(333));
    });

    describe('calculation', function() {
      it('inactive', async function() {
        let block = await time.latestBlock();
        await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(5)), 0, 100000, false, {from: governorAddress});
        expect(await this.incentive.getTimeWeight(this.pair.address)).to.be.bignumber.equal(new BN(0));
      });

      it('default single block', async function() {
        let block = await time.latestBlock();
        await this.incentive.setTimeWeight(this.pair.address, block, 0, 333, true, {from: governorAddress});
        expect(await this.incentive.getTimeWeight(this.pair.address)).to.be.bignumber.equal(new BN(333));
      });

      it('default multi block', async function() {
        let block = await time.latestBlock();
        await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(2)), 0, 333, true, {from: governorAddress});
        expect(await this.incentive.getTimeWeight(this.pair.address)).to.be.bignumber.equal(new BN(999));
      });

      it('custom growth rate single block', async function() {
        let block = await time.latestBlock();
        await this.incentive.setTimeWeight(this.pair.address, block, 0, 1000, true, {from: governorAddress});
        expect(await this.incentive.getTimeWeight(this.pair.address)).to.be.bignumber.equal(new BN(1000));
      });

      it('custom growth rate multi-block', async function() {
        let block = await time.latestBlock();
        await this.incentive.setTimeWeight(this.pair.address, block.sub(new BN(4)), 0, 1000, true, {from: governorAddress});
        expect(await this.incentive.getTimeWeight(this.pair.address)).to.be.bignumber.equal(new BN(5000));
      });
    });
  });

  describe('At peg', function() {
    beforeEach(async function() {
      await this.pair.setReserves(100000, 50000000);
    });

    describe('Buy', function() {
      beforeEach(async function() {
        await this.pair.withdrawFei(userAddress, 10000000);
      });

      it('user balance updates', async function() {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(10000000).add(this.userBalance));
      });

      it('pair balance updates', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(new BN(10000000)));
      });

      it('no incentive', async function() {
        var user = await this.fei.balanceOf(userAddress);
        var pair = await this.fei.balanceOf(this.pair.address);

        expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(new BN(0));
      });

      it('time weight stays inactive', async function() {
        var twInfo = await this.incentive._timeWeights(this.pair.address);
        expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
        expect(twInfo.growthRate).to.be.bignumber.equal(new BN(333));
        expect(twInfo.active).to.be.equal(false);
      });
    });

    describe('Sell', function() {
      describe('enough in wallet', function() {
        beforeEach(async function() {
          this.expectedBurn = new BN(20219); // with rounding error
          await this.fei.transfer(this.pair.address, 500000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(new BN(500000)).sub(this.expectedBurn));
        });

        it('pair balance updates', async function() {
          expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(new BN(500000)));
        });

        it('burn incentive', async function() {
          var user = await this.fei.balanceOf(userAddress);
          var pair = await this.fei.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });

        it('activates time weight', async function() {
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(333));
          expect(twInfo.active).to.be.equal(true);
        });
      });

      describe('not enough in wallet', function() {
        it('reverts', async function() {
          await expectRevert(this.fei.transfer(this.pair.address, 10000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
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
        await this.pair.withdrawFei(userAddress, 10000000);
      });

      it('user balance updates', async function() {
        expect(await this.fei.balanceOf(userAddress)).to.be.bignumber.equal(new BN(10000000).add(this.userBalance));
      });

      it('pair balance updates', async function() {
        expect(await this.fei.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(new BN(10000000)));
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(333));
          expect(twInfo.active).to.be.equal(false);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(333));
          expect(twInfo.active).to.be.equal(false);
        });
      });

      describe('past the peg', function() {
        describe('enough in wallet', function() {
          beforeEach(async function() {
            this.expectedBurn = new BN(20929);
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

          it('activates time weight', async function() {
            var twInfo = await this.incentive._timeWeights(this.pair.address);
            let block = await time.latestBlock()
            expect(twInfo.blockNo).to.be.bignumber.equal(block);
            expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
            expect(twInfo.growthRate).to.be.bignumber.equal(new BN(333));
            expect(twInfo.active).to.be.equal(true);
          });
        });

        describe('not enough in wallet', function() {
          it('reverts', async function() {
            await expectRevert(this.fei.transfer(this.pair.address, 10000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
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
      await this.incentive.setTimeWeight(this.pair.address, block.add(new BN(1)), 0, 100000, true, {from: governorAddress});
    });

    describe('Buy', function() {
      describe('kill switch engaged', function() {
        beforeEach(async function() {
          await this.incentive.setKillSwitch(true, {from: governorAddress});
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(true);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(true);
        });
      });

      describe('to peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(10049);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(false);
        });
      });

      describe('past peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(1000000);
          this.expectedMint = new BN(10049); // should be same as to peg
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(false);
        });
      });

      describe('short of peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(100000);
          this.expectedMint = new BN(2000);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(80043));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(true);
        });
      });

      describe('double time weight', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(20099);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(false);
        });
      });

      describe('double time weight short of peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(100000);
          this.expectedMint = new BN(4000);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(160086));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(true);
        });
      });

      describe('time weight exceeds burn', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(20099);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(false);
        });
      });
    });

    describe('Sell', function() {
      describe('kill switch engaged', function() {
        beforeEach(async function() {
          await this.incentive.setKillSwitch(true, {from: governorAddress});
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(true);
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
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(0));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(true);
        });
      });

      describe('enough in wallet', function() {
        beforeEach(async function() {
          this.expectedBurn = new BN(364841);
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

        it('time weight updates', async function() {
          var twInfo = await this.incentive._timeWeights(this.pair.address);
          let block = await time.latestBlock()
          expect(twInfo.blockNo).to.be.bignumber.equal(block);
          expect(twInfo.weight).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.growthRate).to.be.bignumber.equal(new BN(100000));
          expect(twInfo.active).to.be.equal(true);
        });
      });

      describe('not enough in wallet', function() {
        it('reverts', async function() {
          await expectRevert(this.fei.transfer(this.pair.address, 10000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
        });
      });
    });
  });

  describe('Access', function () {
    describe('Growth Rate', function() {
      it('Governor set succeeds', async function() {
        await this.incentive.setTimeWeightGrowth(this.pair.address, 1000, {from: governorAddress});
        expect(await this.incentive.getGrowthRate(this.pair.address)).to.be.bignumber.equal(new BN(1000));
      });

      it('Unincenitivized contract fails', async function() {
        await expectRevert(this.incentive.setTimeWeightGrowth(userAddress, 1000, {from: governorAddress}), "UniswapIncentive: Account not incentivized");
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setTimeWeightGrowth(this.pair.address, 1000, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Oracle', function() {
      it('Governor set succeeds', async function() {
        await this.incentive.setOracleForPair(this.pair.address, this.oracle.address, {from: governorAddress});
        expect(await this.incentive.getOracle(this.pair.address)).to.be.equal(this.oracle.address);
        expect(await this.incentive.isIncentivized(this.pair.address)).to.be.equal(true);
        expect(await this.incentive.getGrowthRate(this.pair.address)).to.be.bignumber.equal(new BN(333));
      });

      it('Governor unset succeeds', async function() {
        await this.incentive.setOracleForPair(this.pair.address, this.oracle.address, {from: governorAddress});
        await this.incentive.setOracleForPair(this.pair.address, "0x0000000000000000000000000000000000000000", {from: governorAddress});
        expect(await this.incentive.getOracle(this.pair.address)).to.be.equal("0x0000000000000000000000000000000000000000");
        expect(await this.incentive.isIncentivized(this.pair.address)).to.be.equal(false);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setOracleForPair(this.pair.address, this.oracle.address, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Kill Switch', function() {
      it('Governor set succeeds', async function() {
        await this.incentive.setKillSwitch(true, {from: governorAddress});
        expect(await this.incentive.isKillSwitchEnabled()).to.be.equal(true);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setKillSwitch(true, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Exempt Addresses', function() {
      it('Governor set succeeds', async function() {
        await this.incentive.setExemptAddress(userAddress, true, {from: governorAddress});
        expect(await this.incentive.isExemptAddress(userAddress)).to.be.equal(true);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setExemptAddress(userAddress, true, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});