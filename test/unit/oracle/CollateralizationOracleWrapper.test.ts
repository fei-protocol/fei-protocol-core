import { ZERO_ADDRESS, time, getCore, getAddresses, expectRevert, expectEvent } from '../../helpers';
import { expect } from 'chai'
import hre, { ethers, artifacts } from 'hardhat'

const CollateralizationOracleWrapper = artifacts.readArtifactSync('CollateralizationOracleWrapper');
const MockCollateralizationOracle = artifacts.readArtifactSync('MockCollateralizationOracle');
const Proxy = artifacts.readArtifactSync('TransparentUpgradeableProxy');

const e18 = '000000000000000000';

describe('CollateralizationOracleWrapper', function () {
  let userAddress: string
  let guardianAddress: string
  let governorAddress: string

  beforeEach(async function () {
    ({ userAddress, guardianAddress, governorAddress } = await getAddresses());
    this.core = await getCore();
    this.oracle = await MockCollateralizationOracle.new(this.core.address, 2);
    await this.oracle.set('1000', '3000');
    this.oracle2 = await MockCollateralizationOracle.new(this.core.address, 2);

    this.oracleWrapper = await CollateralizationOracleWrapper.new(
      this.core.address,
      '600', // 10 min validity duration
    );

    const proxyContract = await Proxy.new(this.oracleWrapper.address, this.oracleWrapper.address, '0x', { from: userAddress });

    // instantiate the tribalchief pointed at the proxy contract
    this.oracleWrapper = await CollateralizationOracleWrapper.at(proxyContract.address);

    await this.oracleWrapper.initialize(
      this.core.address,
      this.oracle.address,
      '600', // 10 min validity duration
      '500' // 5% deviation threshold
    );
  });

  describe('getters', function() {
    it('collateralizationOracle()', async function() {
      expect(await this.oracleWrapper.collateralizationOracle()).to.be.equal(this.oracle.address);
    });
    it('cachedProtocolControlledValue()', async function() {
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.bignumber.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.bignumber.equal('3000');
    });
    it('cachedUserCirculatingFei()', async function() {
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.bignumber.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.bignumber.equal('1000');
    });
    it('cachedProtocolEquity()', async function() {
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.bignumber.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.bignumber.equal('2000');
    });
    it('deviationThresholdBasisPoints()', async function() {
      expect(await this.oracleWrapper.deviationThresholdBasisPoints()).to.be.bignumber.equal('500');
    });
    it('duration()', async function() {
      expect(await this.oracleWrapper.duration()).to.be.bignumber.equal('600');
    });
  });

  describe('initialize()', function() {
    it('reverts if already initialized', async function() {
      await expectRevert(this.oracleWrapper.initialize(      
        this.core.address,
        this.oracle.address,
        '600', // 10 min validity duration
        '500' // 5% deviation threshold
      ), 'CollateralizationOracleWrapper: initialized');
    });
  });

  describe('setCollateralizationOracle()', function() {
    it('should emit CollateralizationOracleUpdate', async function() {
      expectEvent(
        await this.oracleWrapper.setCollateralizationOracle(this.oracle2.address, { from: governorAddress }),
        'CollateralizationOracleUpdate',
        {
          from: governorAddress,
          oldOracleAddress: this.oracle.address,
          newOracleAddress: this.oracle2.address
        }
      );
    });
    it('should revert if not governor', async function() {
      await expectRevert(
        this.oracleWrapper.setCollateralizationOracle(this.oracle2.address, { from: userAddress }),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if address = 0x0', async function() {
      await expectRevert(
        this.oracleWrapper.setCollateralizationOracle(ZERO_ADDRESS, { from: governorAddress }),
        'CollateralizationOracleWrapper: invalid address'
      );
    });
  });

  describe('setDeviationThresholdBasisPoints()', function() {
    it('should emit DeviationThresholdUpdate', async function() {
      expectEvent(
        await this.oracleWrapper.setDeviationThresholdBasisPoints('300', { from: governorAddress }),
        'DeviationThresholdUpdate',
        {
          from: governorAddress,
          oldThreshold: '500',
          newThreshold: '300'
        }
      );
    });
    it('should revert if not governor', async function() {
      await expectRevert(
        this.oracleWrapper.setDeviationThresholdBasisPoints('300', { from: userAddress }),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if invalid value', async function() {
      await expectRevert(
        this.oracleWrapper.setDeviationThresholdBasisPoints('0', { from: governorAddress }),
        'CollateralizationOracleWrapper: invalid basis points'
      );
      await expectRevert(
        this.oracleWrapper.setDeviationThresholdBasisPoints('10001', { from: governorAddress }),
        'CollateralizationOracleWrapper: invalid basis points'
      );
    });
  });

  describe('setValidityDuration()', function() {
    it('should emit DurationUpdate', async function() {
      expectEvent(
        await this.oracleWrapper.setValidityDuration('3600', { from: governorAddress }),
        'DurationUpdate',
        {
          oldDuration: '600',
          newDuration: '3600'
        }
      );
    });
    it('should revert if not governor', async function() {
      await expectRevert(
        this.oracleWrapper.setValidityDuration('3600', { from: userAddress }),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('IOracle', function() {
    describe('update()', function() {
      it('should refresh the cached values', async function() {
        expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.bignumber.equal('0');
        expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.bignumber.equal('0');
        expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.bignumber.equal('0');
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.bignumber.equal('3000');
        expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.bignumber.equal('1000');
        expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.bignumber.equal('2000');
      });
      it('should refresh the outdated status', async function() {
        await this.oracleWrapper.update();
        await time.increase('10000');
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(true);
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(false);
      });
      it('should revert if paused', async function() {
        await this.oracleWrapper.pause({ from: governorAddress });
        await expectRevert(
          this.oracleWrapper.update({ from: userAddress }),
          'Pausable: paused'
        );
      });
      it('should revert if CollateralizationOracle is invalid', async function() {
        await this.oracle.setValid(false);
        await expectRevert(
          this.oracleWrapper.update({ from: userAddress }),
          'CollateralizationOracleWrapper: CollateralizationOracle is invalid'
        );
      });
    });

    describe('isOutdated()', function() {
      it('should be outdated if cache is old, not if cache is fresh', async function() {
        await this.oracleWrapper.update();
        await time.increase('10000');
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(true);
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.isOutdated()).to.be.equal(false);
      });
    });

    describe('read()', function() {
      it('should return the cached collateral ratio', async function() {
        await this.oracleWrapper.update();
        const val = await this.oracleWrapper.read();
        expect(val[0].value).to.be.bignumber.equal(`3${e18}`); // collateral ratio
        expect(val[1]).to.be.equal(true); // valid
      });
      it('should be invalid if the contract is paused', async function() {
        await this.oracleWrapper.update();
        await this.oracleWrapper.pause({ from: governorAddress });
        const val = await this.oracleWrapper.read();
        expect(val[0].value).to.be.bignumber.equal(`3${e18}`); // collateral ratio
        expect(val[1]).to.be.equal(false); // invalid
      });
      it('should be invalid if the cached value is is outdated', async function() {
        await this.oracleWrapper.update();
        const val = await this.oracleWrapper.read();
        expect(val[0].value).to.be.bignumber.equal(`3${e18}`); // collateral ratio
        expect(val[1]).to.be.equal(true); // valid
        await time.increase('10000');
        const val2 = await this.oracleWrapper.read();
        expect(val2[0].value).to.be.bignumber.equal(`3${e18}`); // collateral ratio
        expect(val2[1]).to.be.equal(false); // invalid
      });
    });
  });

  describe('ICollateralizationOracle', function() {
    beforeEach(async function() {
      await this.oracleWrapper.update();
    });

    describe('isOvercollateralized()', function() {
      it('should revert if outdated', async function() {
        await time.increase('10000');
        await expectRevert(this.oracleWrapper.isOvercollateralized(), 'CollateralizationOracleWrapper: cache is outdated');
      });
      it('should return true/false if the protocol is overcollateralized or not', async function() {
        expect(await this.oracleWrapper.isOvercollateralized()).to.be.equal(true);
        await this.oracle.set('1000', '800');
        expect(await this.oracleWrapper.isOvercollateralized()).to.be.equal(true);
        await this.oracleWrapper.update();
        expect(await this.oracleWrapper.isOvercollateralized()).to.be.equal(false);
      });
    });

    describe('pcvStats()', function() {
      it('should return the cached values', async function() {
        const stats = await this.oracleWrapper.pcvStats();
        expect(stats.protocolControlledValue).to.be.bignumber.equal('3000');
        expect(stats.userCirculatingFei).to.be.bignumber.equal('1000');
        expect(stats.protocolEquity).to.be.bignumber.equal('2000');
        expect(stats.validityStatus).to.be.equal(true);
      });
      it('should be invalid if paused', async function() {
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(true);
        await this.oracleWrapper.pause({ from: governorAddress });
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(false);
      });
      it('should be invalid if outdated', async function() {
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(true);
        await time.increase('10000');
        expect((await this.oracleWrapper.pcvStats()).validityStatus).to.be.equal(false);
      });
    });
  });

  describe('isExceededDeviationThreshold()', function() {
    beforeEach(async function() {
      await this.oracleWrapper.update();
    });

    it('should revert if reading is invalid', async function() {
      await this.oracle.setValid(false);
      await expectRevert(
        this.oracleWrapper.isExceededDeviationThreshold({ from: userAddress }),
        'CollateralizationOracleWrapper: CollateralizationOracle reading is invalid'
      );
    });
    it('should return true if threshold is exceeded', async function() {
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(false);
      await this.oracle.set('1000', '2500');
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(true);
    });
    it('should return false if threshold is not exceeded', async function() {
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(false);
      await this.oracle.set('1000', '2999');
      expect(await this.oracleWrapper.isExceededDeviationThreshold()).to.be.equal(false);
    });
  });

  describe('pcvStatsCurrent()', function() {
    it('should return the actual (not cached) values', async function() {
      await this.oracle.setValid(true);
      const stats = await this.oracleWrapper.pcvStatsCurrent();
      expect(stats.protocolControlledValue).to.be.bignumber.equal('3000');
      expect(stats.userCirculatingFei).to.be.bignumber.equal('1000');
      expect(stats.protocolEquity).to.be.bignumber.equal('2000');
      expect(stats.validityStatus).to.be.equal(true);
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.bignumber.equal('0');
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.bignumber.equal('0');
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.bignumber.equal('0');
      await this.oracleWrapper.update();
      expect(await this.oracleWrapper.cachedProtocolControlledValue()).to.be.bignumber.equal('3000');
      expect(await this.oracleWrapper.cachedUserCirculatingFei()).to.be.bignumber.equal('1000');
      expect(await this.oracleWrapper.cachedProtocolEquity()).to.be.bignumber.equal('2000');
    });
    it('should be invalid if paused', async function() {
      await this.oracleWrapper.pause({ from: governorAddress });
      expect((await this.oracleWrapper.pcvStatsCurrent()).validityStatus).to.be.equal(false);
    });
    it('should be invalid if the CollateralizationOracle is invalid', async function() {
      await this.oracle.setValid(false);
      expect((await this.oracleWrapper.pcvStatsCurrent()).validityStatus).to.be.equal(false);
    });
  });
});
