import { getCore, getAddresses, expectRevert, increaseTime, getImpersonatedSigner } from '../../../helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { CollateralizationOracleWrapper, Core, MockCollateralizationOracle } from '@custom-types/contracts';
import { CollateralizationOracleGuardian } from '@custom-types/contracts/CollateralizationOracleGuardian';

describe('CollateralizationOracleGuardian', function () {
  let userAddress: string;
  let governorAddress: string;
  let oracleWrapper: CollateralizationOracleWrapper;
  let core: Core;
  let oracle: MockCollateralizationOracle;
  let oracleGuardian: CollateralizationOracleGuardian;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.guardianAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress } = await getAddresses());
    core = await getCore();
    oracle = await (await ethers.getContractFactory('MockCollateralizationOracle')).deploy(core.address, 2);
    await oracle.set('1000', '3000');

    oracleWrapper = await (
      await ethers.getContractFactory('CollateralizationOracleWrapper')
    ).deploy(
      core.address,
      '600' // 10 min validity duration
    );

    const proxyContract = await (
      await ethers.getContractFactory('TransparentUpgradeableProxy')
    ).deploy(oracleWrapper.connect(impersonatedSigners[userAddress]).address, oracleWrapper.address, '0x', {});

    // instantiate the tribalchief pointed at the proxy contract
    oracleWrapper = await ethers.getContractAt('CollateralizationOracleWrapper', proxyContract.address);

    await oracleWrapper.initialize(
      core.address,
      oracle.address,
      '600', // 10 min validity duration
      '500' // 5% deviation threshold
    );

    oracleGuardian = await (
      await ethers.getContractFactory('CollateralizationOracleGuardian')
    ).deploy(
      core.address,
      oracleWrapper.address,
      '60', // 1 min setter frequency
      '1000' // 10% deviation allowed
    );

    await oracleWrapper.update();

    // Create and grant the admin role
    await core.createRole(await oracleGuardian.CONTRACT_ADMIN_ROLE(), await core.GOVERN_ROLE());
    await core.grantRole(await oracleGuardian.CONTRACT_ADMIN_ROLE(), oracleGuardian.address);
  });

  describe('Init', function () {
    it('oracleWrapper', async function () {
      expect(await oracleGuardian.oracleWrapper()).to.be.equal(oracleWrapper.address);
    });

    it('deviationThresholdBasisPoints', async function () {
      expect(await oracleGuardian.deviationThresholdBasisPoints()).to.be.equal('1000');
    });

    it('time started', async function () {
      expect(await oracleGuardian.isTimeStarted()).to.be.true;
    });

    it('duration', async function () {
      expect(await oracleGuardian.duration()).to.be.equal('60');
    });
  });

  describe('setCache', function () {
    it('before time reverts', async function () {
      await expectRevert(
        oracleGuardian.connect(impersonatedSigners[governorAddress]).setCache('300', '400'),
        'Timed: time not ended'
      );
    });

    it('should revert if not governor', async function () {
      await expectRevert(
        oracleGuardian.connect(impersonatedSigners[userAddress]).setCache('300', '400'),
        'CoreRef: Caller is not a guardian or governor'
      );
    });

    describe('within deviation', async function () {
      beforeEach(async function () {
        await increaseTime(100);
        await oracleGuardian.connect(impersonatedSigners[governorAddress]).setCache('2900', '950');
      });

      it('succeeds', async function () {
        expect((await oracleWrapper.cachedUserCirculatingFei()).toString()).to.be.equal('950');
        expect((await oracleWrapper.cachedProtocolControlledValue()).toString()).to.be.equal('2900');
        expect((await oracleWrapper.cachedProtocolEquity()).toString()).to.be.equal('1950');

        expect(await oracleGuardian.isTimeEnded()).to.be.false;
      });

      it('second set inside window fails', async function () {
        expect(await oracleGuardian.isTimeEnded()).to.be.false;

        await expectRevert(
          oracleGuardian.connect(impersonatedSigners[governorAddress]).setCache('300', '400'),
          'Timed: time not ended'
        );
      });

      it('second set after time succeeds', async function () {
        await increaseTime(100);
        await oracleGuardian.connect(impersonatedSigners[governorAddress]).setCache('2750', '900');

        expect((await oracleWrapper.cachedUserCirculatingFei()).toString()).to.be.equal('900');
        expect((await oracleWrapper.cachedProtocolControlledValue()).toString()).to.be.equal('2750');
        expect((await oracleWrapper.cachedProtocolEquity()).toString()).to.be.equal('1850');

        expect(await oracleGuardian.isTimeEnded()).to.be.false;
      });
    });

    it('pcv outside deviation reverts', async function () {
      await increaseTime(100);

      await expectRevert(
        oracleGuardian.connect(impersonatedSigners[governorAddress]).setCache('2500', '950'),
        'CollateralizationOracleGuardian: Cached PCV exceeds deviation'
      );
    });

    it('user fei outside deviation reverts', async function () {
      await increaseTime(100);

      await expectRevert(
        oracleGuardian.connect(impersonatedSigners[governorAddress]).setCache('2900', '1950'),
        'CollateralizationOracleGuardian: Cached User FEI exceeds deviation'
      );
    });
  });

  describe('calculateDeviationThresholdBasisPoints()', function () {
    it('100% difference', async function () {
      await expect((await oracleGuardian.calculateDeviationThresholdBasisPoints('100', '0')).toString()).to.be.equal(
        '10000'
      );
    });

    it('50% difference', async function () {
      await expect((await oracleGuardian.calculateDeviationThresholdBasisPoints('1000', '500')).toString()).to.be.equal(
        '5000'
      );
    });

    it('33% difference', async function () {
      await expect((await oracleGuardian.calculateDeviationThresholdBasisPoints('750', '1000')).toString()).to.be.equal(
        '3333'
      );
    });

    it('0% difference', async function () {
      await expect((await oracleGuardian.calculateDeviationThresholdBasisPoints('200', '200')).toString()).to.be.equal(
        '0'
      );
    });
  });

  describe('setDeviationThresholdBasisPoints()', function () {
    it('should emit DeviationThresholdUpdate', async function () {
      await expect(
        await oracleGuardian.connect(impersonatedSigners[governorAddress]).setDeviationThresholdBasisPoints('300')
      )
        .to.emit(oracleGuardian, 'DeviationThresholdUpdate')
        .withArgs('1000', '300');
    });
    it('should revert if not governor', async function () {
      await expectRevert(
        oracleGuardian.connect(impersonatedSigners[userAddress]).setDeviationThresholdBasisPoints('300'),
        'CoreRef: Caller is not a governor'
      );
    });
    it('should revert if invalid value', async function () {
      await expectRevert(
        oracleGuardian.connect(impersonatedSigners[governorAddress]).setDeviationThresholdBasisPoints('10001'),
        'CollateralizationOracleGuardian: deviation exceeds granularity'
      );
    });
  });
});
