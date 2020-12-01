const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert, balance, time } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const UniswapOracle = contract.fromArtifact('UniswapOracle');
const Core = contract.fromArtifact('Core');
const MockPair = contract.fromArtifact('MockUniswapV2PairTrade');

describe('UniswapOracle', function () {
  const [ userAddress, governorAddress ] = accounts;

  beforeEach(async function () {
    this.core = await Core.new({gas: 8000000, from: governorAddress});
    this.startTime = await time.latest();
    this.delta = new BN(1000);
    await time.increase(this.delta);
    this.cursor = this.startTime.add(this.delta);
    this.pair = await MockPair.new(this.delta.mul(new BN(500)), this.delta.div(new BN(500)), this.cursor, 100000, 50000000); // 500:1 FEI/ETH initial price

    this.oracle = await UniswapOracle.new(this.core.address, this.pair.address, 600, true); // 10 min TWAP using price0
  });

  it('initializes', async function() {
    expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.cursor);
    expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.delta.mul(new BN(500)));
  });

  describe('Update', function() {
    beforeEach(async function() {
      await time.increase(1000);
      await this.pair.simulateTrade(100000, 50000000);
      await this.oracle.update();
      this.priorCumulativePrice = await this.oracle.priorCumulative();
      this.priorTime = await this.oracle.priorTimestamp();
      this.twap = (await this.oracle.read())[0].value;
    });

    describe('Within duration', function() {
      beforeEach(async function() {
        await time.increase(100);
        await this.pair.simulateTrade(100000, 50000000); 
        await this.oracle.update();
      });

      it('no change', async function() {
        expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.priorCumulativePrice);
        expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.priorTime);
        expect((await this.oracle.read())[0].value).to.be.equal(this.twap);
      });
    });

    describe('Exceeds duration', function() {
      beforeEach(async function() {
        await time.increase(1000);
        await this.pair.simulateTrade(100000, 50000000); 
        this.expectedCumulative = await this.pair.price0CumulativeLast();
        this.expectedTime = await time.latest();
        await this.oracle.update();
      });

      it('updates', async function() {
        expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.expectedCumulative);
        expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.expectedTime);
        expect((await this.oracle.read())[0].value).to.be.equal(this.twap);
      });
    });

    describe('Price Moves', function() {
      describe('Upward', function() {
        beforeEach(async function() {
          await time.increase(1000);
          await this.pair.simulateTrade(100000, 55000000); 
          await time.increase(1000);
          await this.oracle.update();
        });

        it('updates', async function() {
          expect((await this.oracle.read())[0].value).to.be.equal(this.twap);
        });
      });

      describe('Downward', function() {
        beforeEach(async function() {
          await time.increase(1000);
          await this.pair.simulateTrade(100000, 45000000); 
          await time.increase(1000);
          await this.oracle.update();
        });

        it('updates', async function() {
          expect((await this.oracle.read())[0].value).to.be.equal(this.twap);
        });
      });

      describe('Multiple', function() {
        beforeEach(async function() {
          await time.increase(200);
          await this.pair.simulateTrade(100000, 45000000); 
          await time.increase(200);
          await this.pair.simulateTrade(100000, 49000000);
          await time.increase(200);
          await this.pair.simulateTrade(100000, 53000000);
          await time.increase(200);
          await this.pair.simulateTrade(100000, 52000000);
          await time.increase(200);
          await this.oracle.update();
        });

        it('updates', async function() {
          expect((await this.oracle.read())[0].value).to.be.equal(this.twap);
        });
      });
    });
  });

  describe('Read', function() {
    describe('Uninitialized', function() {
      it('returns invalid', async function() {
        let result = await this.oracle.read();
        expect(result[0].value).to.be.equal('0');
        expect(result[1]).to.be.equal(false);
      });
    });

    describe('Initialized', function() {
      beforeEach(async function() {
        this.cursor = await time.latest();
        await time.increase(1000);
        await this.pair.simulateTrade(100000, 50000000, this.cursor);
        await this.oracle.update();
      });

      describe('Kill switch', function() {
        beforeEach(async function() {
          await this.oracle.setKillSwitch(true, {from: governorAddress});
        });

        it('returns invalid', async function() {
          let result = await this.oracle.read();
          expect(result[0].value).to.be.equal('500000000000000000000');
          expect(result[1]).to.be.equal(false);
        });
      });

      describe('No kill switch', function() {
        it('returns valid', async function() {
          let result = await this.oracle.read();
          expect(result[0].value).to.be.equal('500000000000000000000');
          expect(result[1]).to.be.equal(true);
        });
      });
    });
  });

  describe('Access', function() {
    describe('Kill Switch', function() {
      it('Governor set succeeds', async function() {
        await this.oracle.setKillSwitch(true, {from: governorAddress});
        expect(await this.oracle.killSwitch()).to.be.equal(true);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.oracle.setKillSwitch(false, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Duration', function() {
      it('Governor set succeeds', async function() {
        await this.oracle.setDuration(1000, {from: governorAddress});
        expect(await this.oracle.duration()).to.be.bignumber.equal(new BN(1000));
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.oracle.setDuration(1000, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});