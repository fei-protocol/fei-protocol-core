import { expectRevert, getAddresses, getCore, increaseTime, getImpersonatedSigner } from '@test/helpers';
import { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { Core, Tribe, Fei, TribeReserveStabilizer } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

describe('TribeReserveStabilizer', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;
  let reserveStabilizer: TribeReserveStabilizer;
  let core: Core;
  let fei: Fei;
  let tribe: Tribe;
  let tribeMinter;
  let oracle;
  let collateralizationOracle;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.minterAddress
    ];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress, minterAddress, pcvControllerAddress } = await getAddresses());
    core = await getCore();

    fei = await ethers.getContractAt('Fei', await core.fei());
    tribe = await ethers.getContractAt('Tribe', await core.tribe());
    oracle = await (await ethers.getContractFactory('MockOracle')).deploy(400); // 400:1 oracle price
    collateralizationOracle = await (
      await ethers.getContractFactory('MockCollateralizationOracle')
    ).deploy(core.address, 1);

    tribeMinter = await (await ethers.getContractFactory('MockTribeMinter')).deploy(tribe.address);

    reserveStabilizer = await (
      await ethers.getContractFactory('TribeReserveStabilizer')
    ).deploy(
      core.address,
      oracle.address,
      oracle.address,
      '9000', // $.90 exchange rate
      collateralizationOracle.address,
      '10000', // 100% CR threshold
      tribeMinter.address,
      '10' // 10 second window
    );

    await tribe.connect(impersonatedSigners[governorAddress]).setMinter(tribeMinter.address, {});

    await fei.connect(impersonatedSigners[userAddress]).approve(reserveStabilizer.address, ethers.constants.MaxUint256);
    await fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, 40000000, {});
  });

  describe('Initial State', function () {
    it('collateralizationOracle', async function () {
      expect(await reserveStabilizer.collateralizationOracle()).to.be.equal(collateralizationOracle.address);
    });

    it('collateralizationThreshold', async function () {
      expect((await reserveStabilizer.collateralizationThreshold())[0]).to.be.equal('1000000000000000000');
    });

    it('tribeMinter', async function () {
      expect(await reserveStabilizer.tribeMinter()).to.be.equal(tribeMinter.address);
    });
  });

  describe('OracleDelay', function () {
    it('start during time reverts', async function () {
      reserveStabilizer.connect(impersonatedSigners[userAddress]).startOracleDelayCountdown();

      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[userAddress]).startOracleDelayCountdown(),
        'TribeReserveStabilizer: timer started'
      );
    });

    it('reset above CR reverts', async function () {
      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[userAddress]).resetOracleDelayCountdown(),
        'TribeReserveStabilizer: Collateralization ratio under threshold'
      );
    });

    it('reset before time reverts', async function () {
      await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setCollateralizationThreshold('9900', {});

      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[userAddress]).resetOracleDelayCountdown(),
        'TribeReserveStabilizer: timer started'
      );
    });

    it('startOracleDelayCountdown reverts', async function () {
      await reserveStabilizer.startOracleDelayCountdown();
      await increaseTime(10);

      await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setCollateralizationThreshold('9900', {});

      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[userAddress]).startOracleDelayCountdown(),
        'TribeReserveStabilizer: Collateralization ratio above threshold'
      );
    });
  });

  describe('Exchange', function () {
    beforeEach(async function () {
      await reserveStabilizer.startOracleDelayCountdown();
      await increaseTime(10);
    });

    describe('Enough FEI', function () {
      it('exchanges for appropriate amount of token', async function () {
        const userBalanceBefore = await tribe.balanceOf(userAddress);
        await reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const userBalanceAfter = await tribe.balanceOf(userAddress);

        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(toBN('90000'));

        expect(await fei.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await reserveStabilizer.balance()).to.be.equal(toBN('0'));
      });
    });

    describe('Double Oracle price', function () {
      it('exchanges for appropriate amount of token', async function () {
        await oracle.setExchangeRate('800');

        const userBalanceBefore = await tribe.balanceOf(userAddress);
        await reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const userBalanceAfter = await tribe.balanceOf(userAddress);

        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(toBN('45000'));

        expect(await fei.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await reserveStabilizer.balance()).to.be.equal(toBN('0'));
      });
    });

    describe('Collateralization ratio above threshold', function () {
      it('reset reverts', async function () {
        await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setCollateralizationThreshold('9900', {});
        await reserveStabilizer.resetOracleDelayCountdown();

        await expectRevert(
          reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {}),
          'Timed: time not ended'
        );
      });
    });

    describe('Paused', function () {
      it('reverts', async function () {
        await reserveStabilizer.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(toBN('400000'), {}),
          'Pausable: paused'
        );
      });
    });
    describe('Not Enough FEI', function () {
      it('reverts', async function () {
        await expectRevert(
          reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(50000000, {}),
          'ERC20: transfer amount exceeds balance'
        );
      });
    });
  });

  describe('isCollateralizationBelowThreshold', function () {
    it('collateralization above threshold', async function () {
      await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setCollateralizationThreshold('9900', {});
      expect(await reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(false);
    });

    it('collateralization at threshold', async function () {
      expect(await reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(true);
    });

    it('collateralization below threshold', async function () {
      await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setCollateralizationThreshold('10000', {});
      expect(await reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(true);
    });

    it('reverts invalid reported oracle value', async function () {
      await collateralizationOracle.setValid(false);
      expect(await reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(false);
    });
  });

  describe('Withdraw', function () {
    it('reverts', async function () {
      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[pcvControllerAddress]).withdraw(userAddress, '1000000000', {}),
        "TribeReserveStabilizer: can't withdraw"
      );
    });
  });

  describe('Set USD per FEI', function () {
    it('governor succeeds', async function () {
      await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setUsdPerFeiRate('10000', {});
      expect(await reserveStabilizer.usdPerFeiBasisPoints()).to.be.equal(toBN('10000'));
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[userAddress]).setUsdPerFeiRate('10000', {}),
        'CoreRef: Caller is not a governor'
      );
    });

    it('too high usd per fei reverts', async function () {
      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[governorAddress]).setUsdPerFeiRate('10001', {}),
        'ReserveStabilizer: Exceeds bp granularity'
      );
    });
  });

  describe('setCollateralizationOracle', function () {
    it('governor succeeds', async function () {
      await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setCollateralizationOracle(userAddress);
      expect(await reserveStabilizer.collateralizationOracle()).to.be.equal(userAddress);
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[userAddress]).setCollateralizationOracle(userAddress),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('setCollateralizationThreshold', function () {
    it('governor succeeds', async function () {
      await reserveStabilizer.connect(impersonatedSigners[governorAddress]).setCollateralizationThreshold('9000');
      expect((await reserveStabilizer.collateralizationThreshold())[0]).to.be.equal('900000000000000000');
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        reserveStabilizer.connect(impersonatedSigners[userAddress]).setCollateralizationThreshold('10000'),
        'CoreRef: Caller is not a governor'
      );
    });
  });
});
