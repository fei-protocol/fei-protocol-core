import { expectApprox, expectRevert, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers, artifacts } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

const IdlePCVDeposit = artifacts.readArtifactSync('IdlePCVDeposit');
const MockIdleToken = artifacts.readArtifactSync('MockIdleToken');
const MockERC20 = artifacts.readArtifactSync('MockERC20');

describe('IdlePCVDeposit', function () {
  let userAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
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

    this.token = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.idleToken = await (await ethers.getContractFactory('MockIdleToken')).deploy(this.token.address);

    this.idlePCVDeposit = await (
      await ethers.getContractFactory('IdlePCVDeposit')
    ).deploy(this.core.address, this.idleToken.address, this.token.address, ethers.constants.AddressZero);
    this.depositAmount = toBN('1000000000000000000');
  });

  describe('Deposit', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.idlePCVDeposit.connect(impersonatedSigners[governorAddress]).pause();
        await expectRevert(this.idlePCVDeposit.deposit(), 'Pausable: paused');
      });
    });

    describe('Not Paused', function () {
      beforeEach(async function () {
        await this.token.mint(this.idlePCVDeposit.address, this.depositAmount);
      });

      it('succeeds', async function () {
        expect(await this.idlePCVDeposit.balance()).to.be.equal(toBN('0'));
        await this.idlePCVDeposit.deposit();
        // Balance should increment with the new deposited idleTokens underlying
        expectApprox(await this.idlePCVDeposit.balance(), this.depositAmount, '1');

        // Held balance should be approxmately 0, now invested into IdleToken
        expectApprox(await this.token.balanceOf(this.idlePCVDeposit.address), toBN('0'), '1');
      });
    });
  });

  describe('Withdraw', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.idlePCVDeposit.connect(impersonatedSigners[governorAddress]).pause();
        await expectRevert(
          this.idlePCVDeposit
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdraw(userAddress, this.depositAmount),
          'Pausable: paused'
        );
      });
    });

    describe('Not PCVController', function () {
      it('reverts', async function () {
        await expectRevert(
          this.idlePCVDeposit.connect(impersonatedSigners[userAddress]).withdraw(userAddress, this.depositAmount),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('Not Paused', function () {
      beforeEach(async function () {
        await this.token.mint(this.idlePCVDeposit.address, this.depositAmount);
        await this.idlePCVDeposit.deposit();
      });

      it('succeeds', async function () {
        const userBalanceBefore = await this.token.balanceOf(userAddress);

        // withdrawing should take balance back to approxmately 0
        expectApprox(await this.idlePCVDeposit.balance(), this.depositAmount, '1');
        await this.idlePCVDeposit
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdraw(userAddress, this.depositAmount);
        expect(await this.idlePCVDeposit.balance()).to.be.equal(toBN('0'));

        const userBalanceAfter = await this.token.balanceOf(userAddress);

        expectApprox(userBalanceAfter.sub(userBalanceBefore), this.depositAmount, '1');
      });
    });
  });

  describe('WithdrawERC20', function () {
    describe('Not PCVController', function () {
      it('reverts', async function () {
        await expectRevert(
          this.idlePCVDeposit
            .connect(impersonatedSigners[userAddress])
            .withdrawERC20(this.idleToken.address, userAddress, this.depositAmount),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('From PCVController', function () {
      beforeEach(async function () {
        await this.idleToken.setTokenPrice(toBN('2').mul(toBN('10').pow('18')));
        await this.token.mint(this.idlePCVDeposit.address, this.depositAmount);
        await this.idlePCVDeposit.deposit();
      });

      it('succeeds', async function () {
        expectApprox(await this.idlePCVDeposit.balance(), this.depositAmount, '1');
        // idleToken exchange rate is 2 in the mock, so this would withdraw half of the idleTokens
        await this.idlePCVDeposit
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawERC20(this.idleToken.address, userAddress, this.depositAmount.div(toBN('4')));

        // balance should also get cut in half
        expect(await this.idlePCVDeposit.balance()).to.be.equal(this.depositAmount.div(toBN('2')));

        expect(await this.idleToken.balanceOf(userAddress)).to.be.equal(this.depositAmount.div(toBN('4')));
      });
    });
  });
});
