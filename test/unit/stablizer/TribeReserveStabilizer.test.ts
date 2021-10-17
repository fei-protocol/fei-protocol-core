import { expectRevert, getAddresses, getCore } from '../../helpers';
import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('TribeReserveStabilizer', function () {
  let userAddress;
  let governorAddress;
  let minterAddress;
  let pcvControllerAddress;

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
    ({ userAddress, governorAddress, minterAddress, pcvControllerAddress } = await getAddresses());
    this.core = await getCore();

    this.fei = await ethers.getContractAt('Fei', await this.core.fei());
    this.tribe = await ethers.getContractAt('Tribe', await this.core.tribe());
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(400); // 400:1 oracle price
    this.collateralizationOracle = await (
      await ethers.getContractFactory('MockCollateralizationOracle')
    ).deploy(this.core.address, 1);
    this.pcvDeposit = await (await ethers.getContractFactory('MockEthUniswapPCVDeposit')).deploy(userAddress);

    this.tribeMinter = await (await ethers.getContractFactory('MockTribeMinter')).deploy(this.tribe.address);

    this.reserveStabilizer = await (
      await ethers.getContractFactory('TribeReserveStabilizer')
    ).deploy(
      this.core.address,
      this.oracle.address,
      this.oracle.address,
      '9000', // $.90 exchange rate
      this.collateralizationOracle.address,
      '10000', // 100% CR threshold
      this.tribeMinter.address
    );

    await this.core.connect(impersonatedSigners[governorAddress]).grantBurner(this.reserveStabilizer.address, {});

    await this.tribe.connect(impersonatedSigners[governorAddress]).setMinter(this.tribeMinter.address, {});

    await this.fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, 40000000, {});
  });

  describe('Exchange', function () {
    describe('Enough FEI', function () {
      it('exchanges for appropriate amount of token', async function () {
        const userBalanceBefore = await this.tribe.balanceOf(userAddress);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const userBalanceAfter = await this.tribe.balanceOf(userAddress);

        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(toBN('90000'));

        expect(await this.fei.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await this.reserveStabilizer.balance()).to.be.equal(toBN('0'));
      });
    });

    describe('Double Oracle price', function () {
      it('exchanges for appropriate amount of token', async function () {
        await this.oracle.setExchangeRate('800');

        const userBalanceBefore = await this.tribe.balanceOf(userAddress);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const userBalanceAfter = await this.tribe.balanceOf(userAddress);

        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(toBN('45000'));

        expect(await this.fei.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await this.reserveStabilizer.balance()).to.be.equal(toBN('0'));
      });
    });

    describe('Collateralization ratio above threshold', function () {
      it('reverts', async function () {
        await this.reserveStabilizer
          .connect(impersonatedSigners[governorAddress])
          .setCollateralizationThreshold('9900', {});
        await expectRevert(
          this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {}),
          'TribeReserveStabilizer: Collateralization ratio above threshold'
        );
      });
    });

    describe('Paused', function () {
      it('reverts', async function () {
        await this.reserveStabilizer.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(toBN('400000'), {}),
          'Pausable: paused'
        );
      });
    });
  });

  describe('isCollateralizationBelowThreshold', function () {
    it('above', async function () {
      await this.reserveStabilizer
        .connect(impersonatedSigners[governorAddress])
        .setCollateralizationThreshold('9900', {});
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(false);
    });

    it('at', async function () {
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(true);
    });

    it('below', async function () {
      await this.reserveStabilizer
        .connect(impersonatedSigners[governorAddress])
        .setCollateralizationThreshold('10000', {});
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(true);
    });

    it('invalid oracle', async function () {
      await this.collateralizationOracle.setValid(false);
      expect(await this.reserveStabilizer.isCollateralizationBelowThreshold()).to.be.equal(false);
    });
  });

  describe('Withdraw', function () {
    it('reverts', async function () {
      await expectRevert(
        this.reserveStabilizer
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdraw(userAddress, '1000000000', {}),
        "TribeReserveStabilizer: can't withdraw"
      );
    });
  });

  describe('Not Enough FEI', function () {
    it('reverts', async function () {
      await expectRevert(
        this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(50000000, {}),
        'ERC20: burn amount exceeds balance'
      );
    });
  });

  describe('Paused', function () {
    it('reverts', async function () {
      await this.reserveStabilizer.connect(impersonatedSigners[governorAddress]).pause({});
      await expectRevert(
        this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(toBN('400000'), {}),
        'Pausable: paused'
      );
    });
  });

  describe('Set USD per FEI', function () {
    it('governor succeeds', async function () {
      await this.reserveStabilizer.connect(impersonatedSigners[governorAddress]).setUsdPerFeiRate('10000', {});
      expect(await this.reserveStabilizer.usdPerFeiBasisPoints()).to.be.equal(toBN('10000'));
    });

    it('non-governor reverts', async function () {
      await expectRevert(
        this.reserveStabilizer.connect(impersonatedSigners[userAddress]).setUsdPerFeiRate('10000', {}),
        'CoreRef: Caller is not a governor'
      );
    });

    it('too high usd per fei reverts', async function () {
      await expectRevert(
        this.reserveStabilizer.connect(impersonatedSigners[governorAddress]).setUsdPerFeiRate('10001', {}),
        'ReserveStabilizer: Exceeds bp granularity'
      );
    });
  });
});
