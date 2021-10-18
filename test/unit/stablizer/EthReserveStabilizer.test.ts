import hre, { ethers } from 'hardhat';
import { expectRevert, balance, getAddresses, getCore, deployDevelopmentWeth } from '../../helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('EthReserveStabilizer', function () {
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

    await hre.network.provider.request({
      method: 'hardhat_reset'
    });

    await deployDevelopmentWeth();

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    governorAddress = addresses.governorAddress;
    minterAddress = addresses.minterAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;

    this.core = await getCore();
    this.fei = await ethers.getContractAt('Fei', await this.core.fei());
    this.oracle = await (await ethers.getContractFactory('MockOracle')).deploy(400); // 400:1 oracle price
    this.pcvDeposit = await (await ethers.getContractFactory('MockEthUniswapPCVDeposit')).deploy(userAddress);

    this.reserveStabilizer = await (
      await ethers.getContractFactory('EthReserveStabilizer')
    ).deploy(this.core.address, this.oracle.address, this.oracle.address, '9000');

    this.weth = await ethers.getContractAt('WETH9', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

    this.initialBalance = toBN('1000000000000000000');

    await (
      await ethers.getSigner(userAddress)
    ).sendTransaction({ from: userAddress, to: this.reserveStabilizer.address, value: this.initialBalance });
    
    await this.fei.connect(impersonatedSigners[userAddress]).approve(this.reserveStabilizer.address, ethers.constants.MaxUint256);
    await this.fei.connect(impersonatedSigners[minterAddress]).mint(userAddress, 40000000, {});
  });

  describe('Exchange', function () {
    describe('Enough FEI', function () {
      it('exchanges for appropriate amount of ETH', async function () {
        const reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);

        this.expectedOut = toBN('90000');
        expect(reserveBalanceBefore.sub(reserveBalanceAfter).toString()).to.be.equal(this.expectedOut.toString());

        expect((await this.fei.balanceOf(userAddress)).toString()).to.be.equal('0');
        expect((await this.reserveStabilizer.balance()).toString()).to.be.equal(
          this.initialBalance.sub(this.expectedOut).toString()
        );
      });
    });

    describe('Double Oracle price', function () {
      it('exchanges for appropriate amount of ETH', async function () {
        await this.oracle.setExchangeRate('800');

        const reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);

        this.expectedOut = '45000';
        expect(reserveBalanceBefore.sub(reserveBalanceAfter).toString()).to.be.equal(this.expectedOut);

        expect((await this.fei.balanceOf(userAddress)).toString()).to.be.equal('0');
        expect((await this.reserveStabilizer.balance()).toString()).to.be.equal(
          this.initialBalance.sub(this.expectedOut).toString()
        );
      });
    });

    describe('Higher usd per fei', function () {
      it('exchanges for appropriate amount of ETH', async function () {
        await this.reserveStabilizer.connect(impersonatedSigners[governorAddress]).setUsdPerFeiRate('9500', {});

        const reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
        await this.reserveStabilizer.connect(impersonatedSigners[userAddress]).exchangeFei(40000000, {});
        const reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);

        this.expectedOut = '95000';
        expect(reserveBalanceBefore.sub(reserveBalanceAfter).toString()).to.be.equal(this.expectedOut);

        expect((await this.fei.balanceOf(userAddress)).toString()).to.be.equal('0');
        expect((await this.reserveStabilizer.balance()).toString()).to.be.equal(
          this.initialBalance.sub(this.expectedOut).toString()
        );
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

    describe('Not Enough ETH', function () {
      it('reverts', async function () {
        await this.fei
          .connect(impersonatedSigners[minterAddress])
          .mint(userAddress, toBN('4000000000000000000000000000'), {});
        this.fei
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

  describe('Deposit', function () {
    it('unwraps WETH', async function () {
      await this.weth.deposit({ value: '10000' });
      await this.weth.transfer(this.reserveStabilizer.address, '10000');
      const reserveBalanceBefore = toBN((await balance.current(this.reserveStabilizer.address)).toString());
      await this.reserveStabilizer.deposit();

      expect(await ethers.provider.getBalance(this.reserveStabilizer.address)).to.be.equal(
        reserveBalanceBefore.add(toBN('10000')).toString()
      );
      expect(await this.weth.balanceOf(this.reserveStabilizer.address)).to.be.equal('0');
    });
  });

  describe('Withdraw', function () {
    it('enough eth succeeds', async function () {
      const reserveBalanceBefore = await balance.current(this.reserveStabilizer.address);
      const userBalanceBefore = await balance.current(userAddress);

      await this.reserveStabilizer
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, '10000', {});
      const reserveBalanceAfter = await balance.current(this.reserveStabilizer.address);
      const userBalanceAfter = await balance.current(userAddress);

      expect(reserveBalanceBefore.sub(reserveBalanceAfter).toString()).to.be.equal('10000');
      expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal('10000');
    });

    it('not enough eth reverts', async function () {
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
