import { expectRevert, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('AavePCVDeposit', function () {
  let userAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, pcvControllerAddress, governorAddress } = await getAddresses());

    this.core = await getCore();

    const lendingPoolFactory = await ethers.getContractFactory('MockLendingPool');
    this.lendingPool = await lendingPoolFactory.deploy();

    const tokenFactory = await ethers.getContractFactory('MockERC20');
    this.token = await tokenFactory.deploy();
    this.aToken = await ethers.getContractAt('MockERC20', await this.lendingPool.aToken());

    const aavePCVDepositFactory = await ethers.getContractFactory('AavePCVDeposit');
    this.aavePCVDeposit = await aavePCVDepositFactory.deploy(
      this.core.address,
      this.lendingPool.address,
      this.token.address,
      this.aToken.address,
      this.token.address // filling in dummy address for incentives controller
    );

    this.depositAmount = toBN('1000000000000000000');
  });

  describe('Deposit', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.aavePCVDeposit.connect(impersonatedSigners[governorAddress]).pause();
        await expectRevert(this.aavePCVDeposit.deposit(), 'Pausable: paused');
      });
    });

    describe('Not Paused', function () {
      beforeEach(async function () {
        await this.token.mint(this.aavePCVDeposit.address, this.depositAmount);
      });

      it('succeeds', async function () {
        expect(await this.aavePCVDeposit.balance()).to.be.equal(toBN('0'));
        await this.aavePCVDeposit.deposit();
        // Balance should increment with the new deposited aTokens underlying
        expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount);

        // Held balance should be 0, now invested into Aave
        expect(await this.token.balanceOf(this.aavePCVDeposit.address)).to.be.equal(toBN('0'));
      });
    });
  });

  describe('Withdraw', function () {
    beforeEach(async function () {
      await this.token.mint(this.aavePCVDeposit.address, this.depositAmount);
      await this.aavePCVDeposit.deposit();
    });

    describe('Not PCVController', function () {
      it('reverts', async function () {
        await expectRevert(
          this.aavePCVDeposit.connect(impersonatedSigners[userAddress]).withdraw(userAddress, this.depositAmount),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    it('succeeds', async function () {
      const userBalanceBefore = await this.token.balanceOf(userAddress);

      // withdrawing should take balance back to 0
      expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount);
      await this.aavePCVDeposit
        .connect(impersonatedSigners[pcvControllerAddress])
        .withdraw(userAddress, this.depositAmount);
      expect(await this.aavePCVDeposit.balance()).to.be.equal(toBN('0'));

      const userBalanceAfter = await this.token.balanceOf(userAddress);

      expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(this.depositAmount);
    });
  });

  describe('WithdrawERC20', function () {
    describe('Not PCVController', function () {
      it('reverts', async function () {
        await expectRevert(
          this.aavePCVDeposit
            .connect(impersonatedSigners[userAddress])
            .withdrawERC20(this.aToken.address, userAddress, this.depositAmount),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('From PCVController', function () {
      beforeEach(async function () {
        await this.token.mint(this.aavePCVDeposit.address, this.depositAmount);
        await this.aavePCVDeposit.deposit();
      });

      it('succeeds', async function () {
        expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount);
        await this.aavePCVDeposit
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawERC20(this.aToken.address, userAddress, this.depositAmount.div(toBN('2')));

        // balance should also get cut in half
        expect(await this.aavePCVDeposit.balance()).to.be.equal(this.depositAmount.div(toBN('2')));
        expect(await this.aToken.balanceOf(userAddress)).to.be.equal(this.depositAmount.div(toBN('2')));
      });
    });
  });
});
