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
    this.core = await Core.new({from: governorAddress});
    this.startTime = await time.latest();
    this.delta = new BN(1000);
    await time.increase(this.delta);
    this.cursor = this.startTime.add(this.delta);
    this.cumulative = this.delta.mul(new BN(500));
    this.pair = await MockPair.new(this.cumulative, 0, this.cursor, 100000, 50000000); // 500:1 FEI/ETH initial price

    this.oracle = await UniswapOracle.new(this.core.address, this.pair.address, 600, true); // 10 min TWAP using price0
  });

  it('initializes', async function() {
    expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.cursor);
    expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.delta.mul(new BN(500)));
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
        await this.pair.set(this.cumulative.add(this.delta.mul(new BN(500))), 0, this.cursor.add(new BN(1000)));
        await this.pair.setReserves(100000, 50000000);
        await time.increase(this.delta);
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
  describe('Update', function() {
    beforeEach(async function() {
      this.priorCumulativePrice = await this.oracle.priorCumulative();
      this.priorTime = await this.oracle.priorTimestamp();      
    }) 

    describe('Within duration', function() {
      beforeEach(async function() {
        await this.pair.set(this.cumulative.add(this.delta.mul(new BN(500))), 0, this.cursor.add(new BN(100)));
        await this.oracle.update();
      });

      it('no change', async function() {
        expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.priorCumulativePrice);
        expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.cursor);
      });
    });

    describe('Exceeds duration', function() {
      beforeEach(async function() {
        this.expectedTime = this.cursor.add(new BN(1000))
        this.expectedCumulative = this.cumulative.add(this.delta.mul(new BN(500))); 
        await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
        await this.pair.setReserves(100000, 50000000);
        await time.increase(this.delta);
        expectEvent(
            await this.oracle.update(),
            'Update',
            { _twap: '500' }
          );
      });

      it('updates', async function() {
        expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.expectedCumulative);
        expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.expectedTime);
        expect((await this.oracle.read())[0].value).to.be.equal('500000000000000000000');
      });
    });

    describe('Price Moves', function() {
      describe('Upward', function() {
        beforeEach(async function() {
          this.expectedTime = this.cursor.add(new BN(1000))
          this.expectedCumulative = this.cumulative.add(this.delta.mul(new BN(490))); 
          await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
          await this.pair.setReserves(100000, 49000000);
          await time.increase(this.delta);
          await this.oracle.update();
        });

        it('updates', async function() {
          expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.expectedCumulative);
          expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.expectedTime);
          expect((await this.oracle.read())[0].value).to.be.equal('490000000000000000000');
        });
      });

      describe('Downward', function() {
        beforeEach(async function() {
          this.expectedTime = this.cursor.add(new BN(1000))
          this.expectedCumulative = this.cumulative.add(this.delta.mul(new BN(510))); 
          await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
          await this.pair.setReserves(100000, 51000000);
          await time.increase(this.delta);
          await this.oracle.update();
        });

        it('updates', async function() {
          expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.expectedCumulative);
          expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.expectedTime);
          expect((await this.oracle.read())[0].value).to.be.equal('510000000000000000000');
        });
      });
    });
  });

  describe('Access', function() {
    describe('Kill Switch', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
            await this.oracle.setKillSwitch(true, {from: governorAddress}),
            'KillSwitchUpdate',
            { _killSwitch: true }
          );
        expect(await this.oracle.killSwitch()).to.be.equal(true);
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.oracle.setKillSwitch(false, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
    describe('Duration', function() {
      it('Governor set succeeds', async function() {
        await this.oracle.setDuration(1000, {from: governorAddress});
        expectEvent(
            await this.oracle.setDuration(1000, {from: governorAddress}),
            'DurationUpdate',
            { _duration: '1000' }
          );
        expect(await this.oracle.duration()).to.be.bignumber.equal(new BN(1000));
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.oracle.setDuration(1000, {from: userAddress}), "CoreRef: Caller is not a governor");
      });
    });
  });
});