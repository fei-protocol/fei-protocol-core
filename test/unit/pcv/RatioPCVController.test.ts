import { expectRevert, balance, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers, artifacts } from 'hardhat';
import { Signer } from 'ethers';

const RatioPCVController = artifacts.readArtifactSync('RatioPCVController');
const MockERC20 = artifacts.readArtifactSync('MockERC20');
const MockPCVDeposit = artifacts.readArtifactSync('MockEthUniswapPCVDeposit');

const toBN = ethers.BigNumber.from;

describe('RatioPCVController', function () {
  let userAddress: string;
  let governorAddress: string;
  let pcvControllerAddress: string;

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
    ({ userAddress, governorAddress, pcvControllerAddress } = await getAddresses());
    this.core = await getCore();
    this.token = await (await ethers.getContractFactory('MockERC20')).deploy();

    this.pcvController = await (await ethers.getContractFactory('RatioPCVController')).deploy(this.core.address);

    this.pcvDeposit = await (await ethers.getContractFactory('MockEthUniswapPCVDeposit')).deploy(userAddress);
    await this.pcvDeposit.setBeneficiary(this.pcvDeposit.address);

    this.pcvAmount = toBN('10000000000');
    await impersonatedSigners[userAddress].sendTransaction({
      from: userAddress,
      to: this.pcvDeposit.address,
      value: this.pcvAmount
    });
  });

  describe('Withdraw', function () {
    describe('from pcvController', function () {
      it('100%', async function () {
        const userBalanceBefore = await balance.current(userAddress);
        await this.pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {});
        const userBalanceAfter = await balance.current(userAddress);
        const reserveBalanceAfter = await balance.current(this.pcvDeposit.address);

        expect(reserveBalanceAfter.toString()).to.be.equal('0');
        expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(this.pcvAmount.toString());
      });

      it('50%', async function () {
        const userBalanceBefore = await balance.current(userAddress);
        const reserveBalanceBefore = await balance.current(this.pcvDeposit.address);
        await this.pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatio(this.pcvDeposit.address, userAddress, '5000', {});
        const userBalanceAfter = await balance.current(userAddress);
        const reserveBalanceAfter = await balance.current(this.pcvDeposit.address);

        expect(toBN(reserveBalanceBefore.sub(reserveBalanceAfter).toString())).to.be.equal(this.pcvAmount.div(toBN(2)));
        expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(this.pcvAmount.div(toBN(2)).toString());
      });

      it('200% reverts', async function () {
        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(this.pcvDeposit.address, userAddress, '20000', {}),
          'RatioPCVController: basisPoints too high'
        );
      });

      it('0 value reverts', async function () {
        await this.pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {}); // withdraw all

        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {}),
          'RatioPCVController: no value to withdraw'
        );
      });
    });

    describe('not from pcvController', function () {
      it('reverts', async function () {
        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[userAddress])
            .withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {}),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('paused', function () {
      it('reverts', async function () {
        await this.pcvController.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(this.pcvDeposit.address, userAddress, '10000', {}),
          'Pausable: paused'
        );
      });
    });
  });

  describe('WithdrawERC20', function () {
    beforeEach(async function () {
      await this.token.mint(this.pcvDeposit.address, this.pcvAmount);
    });
    describe('from pcvController', function () {
      it('100%', async function () {
        const userBalanceBefore = await this.token.balanceOf(userAddress);
        await this.pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatioERC20(this.pcvDeposit.address, this.token.address, userAddress, '10000', {});
        const userBalanceAfter = await this.token.balanceOf(userAddress);
        const reserveBalanceAfter = await this.token.balanceOf(this.pcvDeposit.address);

        expect(reserveBalanceAfter).to.be.equal(toBN('0'));
        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(this.pcvAmount);
      });

      it('50%', async function () {
        const userBalanceBefore = await this.token.balanceOf(userAddress);
        const reserveBalanceBefore = await this.token.balanceOf(this.pcvDeposit.address);
        await this.pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatioERC20(this.pcvDeposit.address, this.token.address, userAddress, '5000', {});
        const userBalanceAfter = await this.token.balanceOf(userAddress);
        const reserveBalanceAfter = await this.token.balanceOf(this.pcvDeposit.address);

        expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(this.pcvAmount.div(toBN('2')));
        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(this.pcvAmount.div(toBN('2')));
      });

      it('200% reverts', async function () {
        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(this.pcvDeposit.address, this.token.address, userAddress, '20000', {}),
          'RatioPCVController: basisPoints too high'
        );
      });

      it('0 value reverts', async function () {
        await this.pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatioERC20(this.pcvDeposit.address, this.token.address, userAddress, '10000', {}); // withdraw all

        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(this.pcvDeposit.address, this.token.address, userAddress, '10000', {}),
          'RatioPCVController: no value to withdraw'
        );
      });
    });

    describe('not from pcvController', function () {
      it('reverts', async function () {
        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[userAddress])
            .withdrawRatioERC20(this.pcvDeposit.address, this.token.address, userAddress, '10000', {}),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('paused', function () {
      it('reverts', async function () {
        await this.pcvController.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          this.pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(this.pcvDeposit.address, this.token.address, userAddress, '10000', {}),
          'Pausable: paused'
        );
      });
    });
  });
});
