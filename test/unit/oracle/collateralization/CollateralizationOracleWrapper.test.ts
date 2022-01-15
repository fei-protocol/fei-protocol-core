import { ZERO_ADDRESS, time, getCore, getAddresses, expectRevert } from '../../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const e18 = '000000000000000000';

describe('CollateralizationOracleWrapper', function () {
  let userAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.governorAddress];

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
    this.oracle = await (await ethers.getContractFactory('MockCollateralizationOracle')).deploy(this.core.address, 2);
    await this.oracle.set('1000', '3000');
    this.oracle2 = await (await ethers.getContractFactory('MockCollateralizationOracle')).deploy(this.core.address, 2);

    this.oracleWrapper = await (
      await ethers.getContractFactory('CollateralizationOracleWrapper')
    ).deploy(
      this.core.address,
      '600' // 10 min validity duration
    );

    const proxyContract = await (
      await ethers.getContractFactory('TransparentUpgradeableProxy')
    ).deploy(
      this.oracleWrapper.connect(impersonatedSigners[userAddress]).address,
      this.oracleWrapper.address,
      '0x',
      {}
    );

    // instantiate the tribalchief pointed at the proxy contract
    this.oracleWrapper = await ethers.getContractAt('CollateralizationOracleWrapper', proxyContract.address);

    await this.oracleWrapper.initialize(
      this.core.address,
      this.oracle.address,
      '600', // 10 min validity duration
      '500' // 5% deviation threshold
    );
  });

  describe('getters', function () {
    it('collateralizationOracle()', async function () {
      expect(await this.oracleWrapper.collateralizationOracle()).to.be.equal(this.oracle.address);
    });
    it('cachedProtocolControlledValue()', async function () {
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.equal('3000');
    });
    it('cachedUserCirculatingFei()', async function () {
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.equal('1000');
    });
    it('cachedProtocolEquity()', async function () {
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.equal('2000');
    });
    it('deviationThresholdBasisPoints()', async function () {
      expect(await this.oracleWrapper.deviationThresholdBasisPoints()).to.be.equal('500');
    });
    it('duration()', async function () {
      expect(await this.oracleWrapper.duration()).to.be.equal('600');
    });
  });

  describe('initialize()', function () {
    it('reverts if already initialized', async function () {
      await expectRevert(
        this.oracleWrapper.initialize(
          this.core.address,
          this.oracle.address,
          '600', // 10 min validity duration
          '500' // 5% deviation threshold
        ),
        'CollateralizationOracleWrapper: initialized'
      );
    });
  });

  describe('Read Pause', function () {
    describe('setReadPauseOverride', function () {
      it('governor succeeds', async function () {
        await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setReadPauseOverride(true);
        expect(await this.oracleWrapper.readPauseOverride()).to.be.true;
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          this.oracleWrapper.connect(impersonatedSigners[userAddress]).setReadPauseOverride(true),
          'CoreRef: Caller is not a guardian or governor'
        );
      });
    });

    describe('ReadPause overrides pause', async function () {
      beforeEach(async function () {
        await this.oracleWrapper.update();
        await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).pause();
      });

      it('succeeds', async function () {
        expect((await this.oracleWrapper.read())[1]).to.be.false;
        await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setReadPauseOverride(true);
        expect((await this.oracleWrapper.read())[1]).to.be.true;
      });
    });
  });

  describe('setCollateralizationOracle()', function () {
    it('should emit CollateralizationOracleUpdate', async function () {
      await expect(
        await this.oracleWrapper
          .connect(impersonatedSigners[governorAddress])
          .setCollateralizationOracle(this.oracle2.address)
      )
        .to.emit(this.oracleWrapper, 'CollateralizationOracleUpdate')
        .withArgs(governorAddress, this.oracle.address, this.oracle2.address);
    });
    it('should revert if not governor', async function () {
      await expectRevert(
        this.oracleWrapper
          .connect(impersonatedSigners[userAddress])
          .setCollateralizationOracle(this.oracle2.address, {}),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if address = 0x0', async function () {
      await expectRevert(
        this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setCollateralizationOracle(ZERO_ADDRESS, {}),
        'CollateralizationOracleWrapper: invalid address'
      );
    });
  });

  describe('setDeviationThresholdBasisPoints()', function () {
    it('should emit DeviationThresholdUpdate', async function () {
      await expect(
        await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setDeviationThresholdBasisPoints('300')
      )
        .to.emit(this.oracleWrapper, 'DeviationThresholdUpdate')
        .withArgs(governorAddress, '500', '300');
    });
    it('should revert if not governor', async function () {
      await expectRevert(
        this.oracleWrapper.connect(impersonatedSigners[userAddress]).setDeviationThresholdBasisPoints('300', {}),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if invalid value', async function () {
      await expectRevert(
        this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setDeviationThresholdBasisPoints('0', {}),
        'CollateralizationOracleWrapper: invalid basis points'
      );
      await expectRevert(
        this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setDeviationThresholdBasisPoints('10001', {}),
        'CollateralizationOracleWrapper: invalid basis points'
      );
    });
  });

  describe('setCache()', function () {
    it('should emit CachedValueUpdate', async function () {
      await expect(await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setCache('1', '2', '3'))
        .to.emit(this.oracleWrapper, 'CachedValueUpdate')
        .withArgs(governorAddress, '1', '2', '3');
    });
    it('should update maps & array properties', async function () {
      await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setCache('1', '2', '3');
      expect((await this.oracleWrapper.cachedProtocolControlledValue()).toString()).to.be.equal('1');
      expect((await this.oracleWrapper.cachedUserCirculatingFei()).toString()).to.be.equal('2');
      expect((await this.oracleWrapper.cachedProtocolEquity()).toString()).to.be.equal('3');
    });
    it('should revert if not governor or admin', async function () {
      await expectRevert(
        this.oracleWrapper.connect(impersonatedSigners[userAddress]).setCache('1', '2', '3'),
        'CoreRef: Caller is not a governor or contract admin'
      );
    });
  });

  describe('setValidityDuration()', function () {
    it('should emit DurationUpdate', async function () {
      await expect(await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).setValidityDuration('3600'))
        .to.emit(this.oracleWrapper, 'DurationUpdate')
        .withArgs('600', '3600');
    });
    it('should revert if not governor', async function () {
      await expectRevert(
        this.oracleWrapper.connect(impersonatedSigners[userAddress]).setValidityDuration('3600', {}),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('IOracle', function () {
    describe('update()', function () {
      it('should refresh the cached values', async function () {
        expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.equal('0');
        expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.equal('0');
        expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.equal('0');
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.equal('3000');
        expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.equal('1000');
        expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.equal('2000');
      });
      it('should refresh the outdated status', async function () {
        await this.oracleWrapper.update();
        await time.increase('10000');
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(true);
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(false);
      });
      it('should revert if paused', async function () {
        await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(this.oracleWrapper.connect(impersonatedSigners[userAddress]).update({}), 'Pausable: paused');
      });
      it('should revert if CollateralizationOracle is invalid', async function () {
        await this.oracle.setValid(false);
        await expectRevert(
          this.oracleWrapper.connect(impersonatedSigners[userAddress]).update({}),
          'CollateralizationOracleWrapper: CollateralizationOracle is invalid'
        );
      });
    });

    describe('isOutdated()', function () {
      it('should be outdated if cache is old, not if cache is fresh', async function () {
        await this.oracleWrapper.update();
        await time.increase('10000');
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(true);
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(false);
      });
    });

    describe('read()', function () {
      it('should return the cached collateral ratio', async function () {
        await this.oracleWrapper.update();
        const val = await this.oracleWrapper.read();
        expect(val[0].value).to.be.equal(`3${e18}`); // collateral ratio
        expect(val[1]).to.be.equal(true); // valid
      });
      it('should be invalid if the contract is paused', async function () {
        await this.oracleWrapper.update();
        await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).pause({});
        const val = await this.oracleWrapper.read();
        expect(val[0].value).to.be.equal(`3${e18}`); // collateral ratio
        expect(val[1]).to.be.equal(false); // invalid
      });
      it('should be invalid if the cached value is is outdated', async function () {
        await this.oracleWrapper.update();
        const val = await this.oracleWrapper.read();
        expect(val[0].value).to.be.equal(`3${e18}`); // collateral ratio
        expect(val[1]).to.be.equal(true); // valid
        await time.increase('10000');
        const val2 = await this.oracleWrapper.read();
        expect(val2[0].value).to.be.equal(`3${e18}`); // collateral ratio
        expect(val2[1]).to.be.equal(false); // invalid
      });
    });
  });

  describe('ICollateralizationOracle', function () {
    beforeEach(async function () {
      await this.oracleWrapper.update();
    });

    describe('isOvercollateralized()', function () {
      it('should revert if outdated', async function () {
        await time.increase('10000');
        await expectRevert(
          this.oracleWrapper.isOvercollateralized(),
          'CollateralizationOracleWrapper: cache is outdated'
        );
      });
      it('should return true/false if the protocol is overcollateralized or not', async function () {
        expect(await this.oracleWrapper.isOvercollateralized()).to.be.equal(true);
        await this.oracle.set('1000', '800');
        expect(await this.oracleWrapper.isOvercollateralized()).to.be.equal(true);
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.isOvercollateralized()).to.be.equal(false);
      });
    });

    describe('pcvStats()', function () {
      it('should return the cached values', async function () {
        const stats = await this.oracleWrapper.pcvStats();
        expect(stats.protocolControlledValue).to.be.equal('3000');
        expect(stats.userCirculatingFei).to.be.equal('1000');
        expect(stats.protocolEquity).to.be.equal('2000');
        expect(stats.validityStatus).to.be.equal(true);
      });
      it('should be invalid if paused', async function () {
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(true);
        await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).pause({});
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(false);
      });
      it('should be invalid if outdated', async function () {
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(true);
        await time.increase('10000');
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(false);
      });
    });
  });

  describe('isExceededDeviationThreshold()', function () {
    beforeEach(async function () {
      await this.oracleWrapper.update();
    });

    it('should revert if reading is invalid', async function () {
      await this.oracle.setValid(false);
      await expectRevert(
        this.oracleWrapper.connect(impersonatedSigners[userAddress]).isExceededDeviationThreshold({}),
        'CollateralizationOracleWrapper: CollateralizationOracle reading is invalid'
      );
    });
    it('should return true if threshold is exceeded', async function () {
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(false);
      await this.oracle.set('1000', '2500');
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(true);
    });
    it('should return false if threshold is not exceeded', async function () {
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(false);
      await this.oracle.set('1000', '2999');
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(false);
    });
  });

  describe('pcvStatsCurrent()', function () {
    it('should return the actual (not cached) values', async function () {
      await this.oracle.setValid(true);
      const stats = await this.oracleWrapper.pcvStatsCurrent();
      expect(stats.protocolControlledValue).to.be.equal('3000');
      expect(stats.userCirculatingFei).to.be.equal('1000');
      expect(stats.protocolEquity).to.be.equal('2000');
      expect(stats.validityStatus).to.be.equal(true);
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.equal('0');
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.equal('0');
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.equal('3000');
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.equal('1000');
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.equal('2000');
    });
    it('should be invalid if paused', async function () {
      await this.oracleWrapper.connect(impersonatedSigners[governorAddress]).pause({});
      expect((await this.oracleWrapper.pcvStatsCurrent()).validityStatus).to.be.equal(false);
    });
    it('should be invalid if the CollateralizationOracle is invalid', async function () {
      await this.oracle.setValid(false);
      expect((await this.oracleWrapper.pcvStatsCurrent()).validityStatus).to.be.equal(false);
    });
  });
});
