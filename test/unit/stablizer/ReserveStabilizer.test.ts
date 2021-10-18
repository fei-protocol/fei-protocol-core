import { expectRevert, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('ReserveStabilizer', function () {
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
    this.token = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(400); // 400:1 oracle price
    this.pcvDeposit = await (await ethers.getContractFactory('MockEthUniswapPCVDeposit')).deploy(userAddress);

    this.reserveStabilizer = await (
      await ethers.getContractFactory('ReserveStabilizer')
    ).deploy(this.core.address, this.oracle.address, this.oracle.address, this.token.address, '9000');

    this.initialBalance = toBN('1000000000000000000');
    await this.token.mint(this.reserveStabilizer.address, this.initialBalance);

    await this.fei
      .connect(impersonatedSigners[userAddress])
      .approve(this.reserveStabilizer.address, ethers.constants.MaxUint256);
    await this.fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, 40000000, {});
  });

  describe('Exchange', function () {
    describe('Enough FEI', function () {
      it('exchanges for appropriate amount of token', async function () {
        const reserveBalanceBefore = await this.token.balanceOf(this.reserveStabilizer.address);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const reserveBalanceAfter = await this.token.balanceOf(this.reserveStabilizer.address);

        this.expectedOut = toBN('90000');
        expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(this.expectedOut);

        expect(await this.fei.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await this.reserveStabilizer.balance()).to.be.equal(this.initialBalance.sub(this.expectedOut));
      });
    });

    describe('Double Oracle price', function () {
      it('exchanges for appropriate amount of token', async function () {
        await this.oracle.setExchangeRate('800');

        const reserveBalanceBefore = await this.token.balanceOf(this.reserveStabilizer.address);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const reserveBalanceAfter = await this.token.balanceOf(this.reserveStabilizer.address);

        this.expectedOut = toBN('45000');
        expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(this.expectedOut);

        expect(await this.fei.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await this.reserveStabilizer.balance()).to.be.equal(this.initialBalance.sub(this.expectedOut));
      });
    });

    describe('Higher usd per fei', function () {
      it('exchanges for appropriate amount of token', async function () {
        await this.reserveStabilizer.connect(impersonatedSigners[governorAddress]).setUsdPerFeiRate('9500', {});

        const reserveBalanceBefore = await this.token.balanceOf(this.reserveStabilizer.address);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const reserveBalanceAfter = await this.token.balanceOf(this.reserveStabilizer.address);

        this.expectedOut = toBN('95000');
        expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(this.expectedOut);

        expect(await this.fei.balanceOf(userAddress)).to.be.equal(toBN('0'));
        expect(await this.reserveStabilizer.balance()).to.be.equal(this.initialBalance.sub(this.expectedOut));
      });
    });

    describe('Not Enough FEI', function () {
      it('reverts', async function () {
        await expectRevert(
          this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(50000000, {}),
          'ERC20: transfer amount exceeds balance'
        );
      });
    });

    describe('Not Enough token', function () {
      it('reverts', async function () {
        await this.fei
          .connect(impersonatedSigners[minterAddress])
          .mint(userAddress, toBN('4000000000000000000000000000'), {});
        await expectRevert(
          this.reserveStabilizer
            .connect(impersonatedSigners[userAddress])
            .exchangeFei(toBN('4000000000000000000000000000'), {}),
          'revert'
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

  describe('Withdraw', function () {
    it('enough token succeeds', async function () {
      const reserveBalanceBefore = await this.token.balanceOf(this.reserveStabilizer.address);
      const userBalanceBefore = await this.token.balanceOf(userAddress);

      await this.reserveStabilizer
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, '10000', {});
      const reserveBalanceAfter = await this.token.balanceOf(this.reserveStabilizer.address);
      const userBalanceAfter = await this.token.balanceOf(userAddress);

      expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(toBN('10000'));
      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(toBN('10000'));
    });

    it('not enough token reverts', async function () {
      await expectRevert(
        this.reserveStabilizer
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdraw(userAddress, '10000000000000000000', {}),
        'revert'
      );
    });

    it('non pcvController', async function () {
      await expectRevert(
        this.reserveStabilizer.connect(impersonatedSigners[userAddress]).withdraw(userAddress, '10000', {}),
        'CoreRef: Caller is not a PCV controller'
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
