const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Fii = contract.fromArtifact('Fii');
const Core = contract.fromArtifact('Core');
const UniswapIncentive = contract.fromArtifact('UniswapIncentive');
const MockPair = contract.fromArtifact('MockUniswapV2PairLiquidity');
const MockOracle = contract.fromArtifact('MockOracle');
const MockERC20 = contract.fromArtifact('MockERC20');

describe('UniswapIncentive', function () {
  return;
  const [ userAddress, minterAddress, governorAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({gas: 8000000, from: governorAddress});
    this.fii = await Fii.at(await this.core.fii());
    this.incentive = await UniswapIncentive.new(this.core.address);
    this.token = await MockERC20.new();
    this.pair = await MockPair.new(this.token.address, this.fii.address);
    this.oracle = await MockOracle.new(500); // 500:1 USD/ETH exchange rate

    await this.core.grantMinter(this.incentive.address, {from: governorAddress});
    await this.core.grantBurner(this.incentive.address, {from: governorAddress});
    await this.core.grantMinter(minterAddress, {from: governorAddress});
    await this.fii.setIncentiveContract(this.pair.address, this.incentive.address, {from: governorAddress});
    await this.fii.mint(userAddress, 50000000, {from: minterAddress});
    await this.incentive.setOracle(this.pair.address, this.oracle.address, {from: governorAddress});

    this.userBalance = new BN(50000000);
    await this.fii.mint(this.pair.address, 50000000, {from: minterAddress});
    this.pairBalance = new BN(50000000);
  });

  describe('At peg', function() {
    beforeEach(async function() {
      await this.pair.setReserves(100000, 50000000);
    });

    describe('Buy', function() {
      beforeEach(async function() {
        await this.pair.withdrawFii(userAddress, 10000000);
      });

      it('user balance updates', async function() {
        expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(new BN(10000000).add(this.userBalance));
      });

      it('pair balance updates', async function() {
        expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(new BN(10000000)));
      });

      it('no incentive', async function() {
        var user = await this.fii.balanceOf(userAddress);
        var pair = await this.fii.balanceOf(this.pair.address);

        expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(new BN(0));
      });
    });

    describe('Sell', function() {
      describe('enough in wallet', function() {
        beforeEach(async function() {
          this.expectedBurn = new BN(20219); // with rounding error
          await this.fii.transfer(this.pair.address, 500000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(new BN(500000)).sub(this.expectedBurn));
        });

        it('pair balance updates', async function() {
          expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(new BN(500000)));
        });

        it('burn incentive', async function() {
          var user = await this.fii.balanceOf(userAddress);
          var pair = await this.fii.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });
      });

      describe('not enough in wallet', function() {
        it('reverts', async function() {
          await expectRevert(this.fii.transfer(this.pair.address, 10000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
        });
      });
    });
  });

  describe('Above peg', function() {
    beforeEach(async function() {
      // 490 FII/ETH = 2% away
      await this.pair.setReserves(100000, 49000000);
    });

    describe('Buy', function() {

      beforeEach(async function() {
        await this.pair.withdrawFii(userAddress, 10000000);
      });

      it('user balance updates', async function() {
        expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(new BN(10000000).add(this.userBalance));
      });

      it('pair balance updates', async function() {
        expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(new BN(10000000)));
      });

      it('no incentive', async function() {
        var user = await this.fii.balanceOf(userAddress);
        var pair = await this.fii.balanceOf(this.pair.address);

        expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(new BN(0));
      });
    });

    describe('Sell', function() {
      describe('short of peg', function() {
        beforeEach(async function() {
          // No expected burn
          await this.fii.transfer(this.pair.address, 100000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(new BN(100000)));
        });

        it('pair balance updates', async function() {
          expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(new BN(100000)));
        });

        it('no incentive', async function() {
          var user = await this.fii.balanceOf(userAddress);
          var pair = await this.fii.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('to peg', function() {
        beforeEach(async function() {
          // No expected burn
          this.transferAmount = new BN(497470);
          await this.fii.transfer(this.pair.address, 497470, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount));
        });

        it('pair balance updates', async function() {
          expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount));
        });

        it('no incentive', async function() {
          var user = await this.fii.balanceOf(userAddress);
          var pair = await this.fii.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(new BN(0));
        });
      });

      describe('past the peg', function() {
        describe('enough in wallet', function() {
          beforeEach(async function() {
            this.expectedBurn = new BN(41649); // with rounding error
            this.transferAmount = new BN(1000000);
            await this.fii.transfer(this.pair.address, 1000000, {from: userAddress});
          });

          it('user balance updates', async function() {
            expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount).sub(this.expectedBurn));
          });

          it('pair balance updates', async function() {
            expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount));
          });

          it('burn incentive', async function() {
            var user = await this.fii.balanceOf(userAddress);
            var pair = await this.fii.balanceOf(this.pair.address);

            expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
          });
        });

        describe('not enough in wallet', function() {
          it('reverts', async function() {
            await expectRevert(this.fii.transfer(this.pair.address, 10000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
          });
        });
      });
    });
  });

  describe('Below peg', function() {
    beforeEach(async function() {
      // 510 FII/ETH = 2% away
      await this.pair.setReserves(100000, 51000000);
    });

    describe('Buy', function() {
      describe('to peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(502500);
          this.expectedMint = new BN(10050);
          await this.pair.withdrawFii(userAddress, 502500);
        });

        it('user balance updates', async function() {
          expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fii.balanceOf(userAddress);
          var pair = await this.fii.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });
      });

      describe('past peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(1000000);
          this.expectedMint = new BN(10050); // should be same as to peg
          await this.pair.withdrawFii(userAddress, 1000000);
        });

        it('user balance updates', async function() {
          expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fii.balanceOf(userAddress);
          var pair = await this.fii.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });
      });

      describe('short of peg', function() {
        beforeEach(async function() {
          this.transferAmount = new BN(100000);
          this.expectedMint = new BN(2000);
          await this.pair.withdrawFii(userAddress, 100000);
        });

        it('user balance updates', async function() {
          expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.transferAmount.add(this.userBalance).add(this.expectedMint));
        });

        it('pair balance updates', async function() {
          expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.sub(this.transferAmount));
        });

        it('mint incentive', async function() {
          var user = await this.fii.balanceOf(userAddress);
          var pair = await this.fii.balanceOf(this.pair.address);

          expect(user.add(pair).sub(this.userBalance).sub(this.pairBalance)).to.be.bignumber.equal(this.expectedMint);
        });
      });
    });

    describe('Sell', function() {
      describe('enough in wallet', function() {
        beforeEach(async function() {
          this.expectedBurn = new BN(364841);
          this.transferAmount = new BN(1000000);
          await this.fii.transfer(this.pair.address, 1000000, {from: userAddress});
        });

        it('user balance updates', async function() {
          expect(await this.fii.balanceOf(userAddress)).to.be.bignumber.equal(this.userBalance.sub(this.transferAmount).sub(this.expectedBurn));
        });

        it('pair balance updates', async function() {
          expect(await this.fii.balanceOf(this.pair.address)).to.be.bignumber.equal(this.pairBalance.add(this.transferAmount));
        });

        it('burn incentive', async function() {
          var user = await this.fii.balanceOf(userAddress);
          var pair = await this.fii.balanceOf(this.pair.address);

          expect(this.userBalance.add(this.pairBalance).sub(user).sub(pair)).to.be.bignumber.equal(this.expectedBurn);
        });
      });

      describe('not enough in wallet', function() {
        it('reverts', async function() {
          await expectRevert(this.fii.transfer(this.pair.address, 10000000, {from: userAddress}), "ERC20: burn amount exceeds balance");
        });
      });
    });
  });

  describe('Access', function () {
    describe('Oracle', function() {
      it('Governor set succeeds', async function() {
        await this.incentive.setOracle(this.pair.address, this.oracle.address, {from: governorAddress});
        expect(await this.incentive.getOracle(this.pair.address)).to.be.equal(this.oracle.address);
        expect(await this.incentive.isIncentivized(this.pair.address)).to.be.equal(true);
      });

      it('Governor unset succeeds', async function() {
        await this.incentive.setOracle(this.pair.address, this.oracle.address, {from: governorAddress});
        await this.incentive.setOracle(this.pair.address, "0x0000000000000000000000000000000000000000", {from: governorAddress});
        expect(await this.incentive.getOracle(this.pair.address)).to.be.equal("0x0000000000000000000000000000000000000000");
        expect(await this.incentive.isIncentivized(this.pair.address)).to.be.equal(false);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.incentive.setOracle(this.pair.address, this.oracle.address, {from: userAddress}), "CoreRef: Caller is not a governor");
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