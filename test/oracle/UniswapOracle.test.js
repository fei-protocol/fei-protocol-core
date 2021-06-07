const {
  BN,
  expectEvent,
  expectRevert,
  time,
  expect,
  getAddresses,
  getCore,
} = require('../helpers');

const UniswapOracle = artifacts.require('UniswapOracle');
const MockPairTrade = artifacts.require('MockUniswapV2PairTrade');

describe.skip('UniswapOracle', function () {
  let userAddress;
  let governorAddress;

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());

    this.core = await getCore(true);
    
    this.startTime = await time.latest();
    this.delta = new BN(1000);
    this.hundredTwelve = new BN(2).pow(new BN(112));
    await time.increase(this.delta);
    
    this.cursor = this.startTime.add(this.delta);
    this.cumulative = this.hundredTwelve.mul(this.delta.add(new BN(2))).mul(new BN(500)).div(new BN(1e12));
    
    this.pair = await MockPairTrade.new(this.cumulative, 0, this.cursor, new BN(100000).mul(new BN(1e12)), 50000000); // 500:1 FEI/ETH initial price

    this.duration = new BN('600');
    this.oracle = await UniswapOracle.new(this.core.address, this.pair.address, this.duration, true); // 10 min TWAP using price0
  });

  describe('Init', function() {
    it('priors', async function() {
      expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.cursor.add(new BN(2)));
      expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.cumulative);
    });

    it('pair', async function() {
      expect(await this.oracle.pair()).to.be.equal(this.pair.address);
    });

    it('duration', async function() {
      expect(await this.oracle.duration()).to.be.bignumber.equal(this.duration);
    });

    it('paused', async function() {
      expect(await this.oracle.paused()).to.be.equal(false);
    });
  });

  describe('Read', function() {
    describe('Uninitialized', function() {
      it('returns invalid', async function() {
        const result = await this.oracle.read();
        expect(result[0].value).to.be.equal('0');
        expect(result[1]).to.be.equal(false);
      });
    });

    describe('Initialized', function() {
      beforeEach(async function() {
        await this.pair.set(this.cumulative.add(this.hundredTwelve.mul(this.delta).mul(new BN(500)).div(new BN(1e12))), 0, this.cursor.add(new BN(1000)));
        await this.pair.setReserves(100000, 50000000);
        await time.increase(this.delta);
        await this.oracle.update();
      });

      describe('Paused', function() {
        beforeEach(async function() {
          await this.oracle.pause({from: governorAddress});
        });

        it('returns invalid', async function() {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('499999999999999999999');
          expect(result[1]).to.be.equal(false);
        });
      });

      describe('Unpaused', function() {
        it('returns valid', async function() {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('499999999999999999999');
          expect(result[1]).to.be.equal(true);
        });
      });
    });
  });
  describe('Update', function() {
    beforeEach(async function() {
      this.priorCumulativePrice = await this.oracle.priorCumulative();
      this.priorTime = await this.oracle.priorTimestamp();      
    });
    
    describe('Paused', function() {
      it('reverts', async function() {
        await this.oracle.pause({from: governorAddress});
        await expectRevert(this.oracle.update(), 'Pausable: paused');
      });
    });
    
    describe('Within duration', function() {
      beforeEach(async function() {
        await this.pair.set(this.cumulative.add(this.hundredTwelve.mul(this.delta).mul(new BN(500)).div(new BN(1e12))), 0, this.cursor.add(new BN(1000)));
        await this.oracle.update();
      });

      it('no change', async function() {
        expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.priorCumulativePrice);
        expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.cursor);
      });

      it('not outdated', async function() {
        expect(await this.oracle.isOutdated()).to.be.equal(false);
      });
    });

    describe('Exceeds duration', function() {
      beforeEach(async function() {
        this.expectedTime = this.cursor.add(new BN(1000));
        this.expectedCumulative = this.cumulative.add(this.hundredTwelve.mul(this.delta).mul(new BN(500)).div(new BN(1e12))); 
        await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
        await this.pair.setReserves(100000, 50000000);
        await time.increase(this.delta);
      });

      it('outdated', async function() {
        expect(await this.oracle.isOutdated()).to.be.equal(true);
      });

      it('updates', async function() {
        expectEvent(
          await this.oracle.update(),
          'Update',
          { _peg: '499' }
        );
        expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.expectedCumulative);
        expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.expectedTime);
        expect((await this.oracle.read())[0].value).to.be.equal('499999999999999999999');
      });
    });

    describe('Price Moves', function() {
      describe('Upward', function() {
        beforeEach(async function() {
          this.expectedTime = this.cursor.add(new BN(1000));
          this.expectedCumulative = this.cumulative.add(this.hundredTwelve.mul(this.delta).mul(new BN(490)).div(new BN(1e12))); 
          await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
          await this.pair.setReserves(100000, 49000000);
          await time.increase(this.delta);
          await this.oracle.update();
        });

        it('updates', async function() {
          expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.expectedCumulative);
          expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.expectedTime);
          expect((await this.oracle.read())[0].value).to.be.equal('489999999999999999999');
        });
      });

      describe('Downward', function() {
        beforeEach(async function() {
          this.expectedTime = this.cursor.add(new BN(1000));
          this.expectedCumulative = this.cumulative.add(this.hundredTwelve.mul(this.delta).mul(new BN(510)).div(new BN(1e12))); 
          await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
          await this.pair.setReserves(100000, 51000000);
          await time.increase(this.delta);
          await this.oracle.update();
        });

        it('updates', async function() {
          expect(await this.oracle.priorCumulative()).to.be.bignumber.equal(this.expectedCumulative);
          expect(await this.oracle.priorTimestamp()).to.be.bignumber.equal(this.expectedTime);
          expect((await this.oracle.read())[0].value).to.be.equal('509999999999999999999');
        });
      });
    });
  });

  describe('Access', function() {
    describe('Duration', function() {
      it('Governor set succeeds', async function() {
        expectEvent(
          await this.oracle.setDuration(1000, {from: governorAddress}),
          'DurationUpdate',
          { _duration: '1000' }
        );
        expect(await this.oracle.duration()).to.be.bignumber.equal(new BN(1000));
      });

      it('Non-governor set reverts', async function() {
        await expectRevert(this.oracle.setDuration(1000, {from: userAddress}), 'CoreRef: Caller is not a governor');
      });
    });
  });
});
