import { expectRevert, time, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe.skip('UniswapOracle', function () {
  let userAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.pcvControllerAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
    ];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());

    this.core = await getCore();

    this.startTime = await time.latest();
    this.delta = toBN(1000);
    this.hundredTwelve = toBN(2).pow(toBN(112));
    await time.increase(Number(this.delta.toString()));

    this.cursor = this.startTime.add(Number(this.delta.toString()));
    this.cumulative = this.hundredTwelve
      .mul(this.delta.add(toBN(2)))
      .mul(toBN(500))
      .div(toBN(1e12));

    this.pair = await (
      await ethers.getContractFactory('MockUniswapV2PairTrade')
    ).deploy(this.cumulative, 0, this.cursor, toBN(100000).mul(toBN(1e12)), 50000000); // 500:1 FEI/ETH initial price

    this.duration = toBN('600');
    this.oracle = await (
      await ethers.getContractFactory('UniswapOracle')
    ).deploy(this.core.address, this.pair.address, this.duration, true); // 10 min TWAP using price0
  });

  describe('Init', function () {
    it('priors', async function () {
      expect(await this.oracle.priorTimestamp()).to.be.equal(this.cursor.add(toBN(2)));
      expect(await this.oracle.priorCumulative()).to.be.equal(this.cumulative);
    });

    it('pair', async function () {
      expect(await this.oracle.pair()).to.be.equal(this.pair.address);
    });

    it('duration', async function () {
      expect(await this.oracle.duration()).to.be.equal(this.duration);
    });

    it('paused', async function () {
      expect(await this.oracle.paused()).to.be.equal(false);
    });
  });

  describe('Read', function () {
    describe('Uninitialized', function () {
      it('returns invalid', async function () {
        const result = await this.oracle.read();
        expect(result[0].value).to.be.equal('0');
        expect(result[1]).to.be.equal(false);
      });
    });

    describe('Initialized', function () {
      beforeEach(async function () {
        await this.pair.set(
          this.cumulative.add(this.hundredTwelve.mul(this.delta).mul(toBN(500)).div(toBN(1e12))),
          0,
          this.cursor.add(toBN(1000))
        );
        await this.pair.setReserves(100000, 50000000);
        await time.increase(this.delta);
        await this.oracle.update();
      });

      describe('Paused', function () {
        beforeEach(async function () {
          await this.oracle.connect(impersonatedSigners[governorAddress]).pause({});
        });

        it('returns invalid', async function () {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('499999999999999999999');
          expect(result[1]).to.be.equal(false);
        });
      });

      describe('Unpaused', function () {
        it('returns valid', async function () {
          const result = await this.oracle.read();
          expect(result[0].value).to.be.equal('499999999999999999999');
          expect(result[1]).to.be.equal(true);
        });
      });
    });
  });
  describe('Update', function () {
    beforeEach(async function () {
      this.priorCumulativePrice = await this.oracle.priorCumulative();
      this.priorTime = await this.oracle.priorTimestamp();
    });

    describe('Paused', function () {
      it('reverts', async function () {
        await this.oracle.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(this.oracle.update(), 'Pausable: paused');
      });
    });

    describe('Within duration', function () {
      beforeEach(async function () {
        await this.pair.set(
          this.cumulative.add(this.hundredTwelve.mul(this.delta).mul(toBN(500)).div(toBN(1e12))),
          0,
          this.cursor.add(toBN(1000))
        );
        await this.oracle.update();
      });

      it('no change', async function () {
        expect(await this.oracle.priorCumulative()).to.be.equal(this.priorCumulativePrice);
        expect(await this.oracle.priorTimestamp()).to.be.equal(this.cursor);
      });

      it('not outdated', async function () {
        expect(await this.oracle.isOutdated()).to.be.equal(false);
      });
    });

    describe('Exceeds duration', function () {
      beforeEach(async function () {
        this.expectedTime = this.cursor.add(toBN(1000));
        this.expectedCumulative = this.cumulative.add(
          this.hundredTwelve.mul(this.delta).mul(toBN(500)).div(toBN(1e12))
        );
        await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
        await this.pair.setReserves(100000, 50000000);
        await time.increase(this.delta);
      });

      it('outdated', async function () {
        expect(await this.oracle.isOutdated()).to.be.equal(true);
      });

      it('updates', async function () {
        await expect(await this.oracle.update())
          .to.emit(this.oracle, 'Update')
          .withArgs('499');

        expect(await this.oracle.priorCumulative()).to.be.equal(this.expectedCumulative);
        expect(await this.oracle.priorTimestamp()).to.be.equal(this.expectedTime);
        expect((await this.oracle.read())[0].value).to.be.equal('499999999999999999999');
      });
    });

    describe('Price Moves', function () {
      describe('Upward', function () {
        beforeEach(async function () {
          this.expectedTime = this.cursor.add(toBN(1000));
          this.expectedCumulative = this.cumulative.add(
            this.hundredTwelve.mul(this.delta).mul(toBN(490)).div(toBN(1e12))
          );
          await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
          await this.pair.setReserves(100000, 49000000);
          await time.increase(this.delta);
          await this.oracle.update();
        });

        it('updates', async function () {
          expect(await this.oracle.priorCumulative()).to.be.equal(this.expectedCumulative);
          expect(await this.oracle.priorTimestamp()).to.be.equal(this.expectedTime);
          expect((await this.oracle.read())[0].value).to.be.equal('489999999999999999999');
        });
      });

      describe('Downward', function () {
        beforeEach(async function () {
          this.expectedTime = this.cursor.add(toBN(1000));
          this.expectedCumulative = this.cumulative.add(
            this.hundredTwelve.mul(this.delta).mul(toBN(510)).div(toBN(1e12))
          );
          await this.pair.set(this.expectedCumulative, 0, this.expectedTime);
          await this.pair.setReserves(100000, 51000000);
          await time.increase(this.delta);
          await this.oracle.update();
        });

        it('updates', async function () {
          expect(await this.oracle.priorCumulative()).to.be.equal(this.expectedCumulative);
          expect(await this.oracle.priorTimestamp()).to.be.equal(this.expectedTime);
          expect((await this.oracle.read())[0].value).to.be.equal('509999999999999999999');
        });
      });
    });
  });

  describe('Access', function () {
    describe('Duration', function () {
      it('Governor set succeeds', async function () {
        await expect(await this.oracle.connect(impersonatedSigners[governorAddress]).setDuration(1000))
          .to.emit(this.oracle, 'DurationUpdate')
          .withArgs('1000');

        expect(await this.oracle.duration()).to.be.equal(toBN(1000));
      });

      it('Non-governor set reverts', async function () {
        await expectRevert(
          this.oracle.connect(impersonatedSigners[userAddress]).setDuration(1000, {}),
          'CoreRef: Caller is not a governor'
        );
      });
    });
  });
});
