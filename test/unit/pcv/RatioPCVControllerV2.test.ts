import { expectRevert, balance, getAddresses, getCore, getImpersonatedSigner } from '../../helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import { MockEthUniswapPCVDeposit, Core, RatioPCVControllerV2, MockERC20 } from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

describe('RatioPCVControllerV2', function () {
  let userAddress: string;
  let governorAddress: string;
  let pcvControllerAddress: string;
  let pcvDeposit: MockEthUniswapPCVDeposit;
  let core: Core;
  let pcvController: RatioPCVControllerV2;
  let token: MockERC20;
  let pcvAmount: BigNumber;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress, pcvControllerAddress } = await getAddresses());
    core = await getCore();
    token = await (await ethers.getContractFactory('MockERC20')).deploy();

    pcvController = await (await ethers.getContractFactory('RatioPCVControllerV2')).deploy(core.address);

    pcvDeposit = await (await ethers.getContractFactory('MockEthUniswapPCVDeposit')).deploy(userAddress);
    await pcvDeposit.setBeneficiary(pcvDeposit.address);

    pcvAmount = toBN('10000000000');
    await impersonatedSigners[userAddress].sendTransaction({
      from: userAddress,
      to: pcvDeposit.address,
      value: pcvAmount
    });
  });

  describe('Withdraw', function () {
    describe('from pcvController', function () {
      it('100%', async function () {
        const userBalanceBefore = await balance.current(userAddress);
        await pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatio(pcvDeposit.address, userAddress, '10000', {});
        const userBalanceAfter = await balance.current(userAddress);
        const reserveBalanceAfter = await balance.current(pcvDeposit.address);

        expect(reserveBalanceAfter.toString()).to.be.equal('0');
        expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
      });

      it('50%', async function () {
        const userBalanceBefore = await balance.current(userAddress);
        const reserveBalanceBefore = await balance.current(pcvDeposit.address);
        await pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatio(pcvDeposit.address, userAddress, '5000', {});
        const userBalanceAfter = await balance.current(userAddress);
        const reserveBalanceAfter = await balance.current(pcvDeposit.address);

        expect(toBN(reserveBalanceBefore.sub(reserveBalanceAfter).toString())).to.be.equal(pcvAmount.div(toBN(2)));
        expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.div(toBN(2)).toString());
      });

      it('200% reverts', async function () {
        await expectRevert(
          pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(pcvDeposit.address, userAddress, '20000', {}),
          'RatioPCVController: basisPoints too high'
        );
      });

      it('0 value reverts', async function () {
        await pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatio(pcvDeposit.address, userAddress, '10000', {}); // withdraw all

        await expectRevert(
          pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(pcvDeposit.address, userAddress, '10000', {}),
          'RatioPCVController: no value to withdraw'
        );
      });
    });

    describe('not from pcvController', function () {
      it('reverts', async function () {
        await expectRevert(
          pcvController
            .connect(impersonatedSigners[userAddress])
            .withdrawRatio(pcvDeposit.address, userAddress, '10000', {}),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('paused', function () {
      it('reverts', async function () {
        await pcvController.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(pcvDeposit.address, userAddress, '10000', {}),
          'Pausable: paused'
        );
      });
    });
  });

  describe('WithdrawERC20', function () {
    beforeEach(async function () {
      await token.mint(pcvDeposit.address, pcvAmount);
    });
    describe('from pcvController', function () {
      it('100%', async function () {
        const userBalanceBefore = await token.balanceOf(userAddress);
        await pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatioERC20(pcvDeposit.address, token.address, userAddress, '10000', {});
        const userBalanceAfter = await token.balanceOf(userAddress);
        const reserveBalanceAfter = await token.balanceOf(pcvDeposit.address);

        expect(reserveBalanceAfter).to.be.equal(toBN('0'));
        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount);
      });

      it('50%', async function () {
        const userBalanceBefore = await token.balanceOf(userAddress);
        const reserveBalanceBefore = await token.balanceOf(pcvDeposit.address);
        await pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatioERC20(pcvDeposit.address, token.address, userAddress, '5000', {});
        const userBalanceAfter = await token.balanceOf(userAddress);
        const reserveBalanceAfter = await token.balanceOf(pcvDeposit.address);

        expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(pcvAmount.div(toBN('2')));
        expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount.div(toBN('2')));
      });

      it('200% reverts', async function () {
        await expectRevert(
          pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(pcvDeposit.address, token.address, userAddress, '20000', {}),
          'RatioPCVController: basisPoints too high'
        );
      });

      it('0 value reverts', async function () {
        await pcvController
          .connect(impersonatedSigners[pcvControllerAddress])
          .withdrawRatioERC20(pcvDeposit.address, token.address, userAddress, '10000', {}); // withdraw all

        await expectRevert(
          pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(pcvDeposit.address, token.address, userAddress, '10000', {}),
          'RatioPCVController: no value to withdraw'
        );
      });
    });

    describe('not from pcvController', function () {
      it('reverts', async function () {
        await expectRevert(
          pcvController
            .connect(impersonatedSigners[userAddress])
            .withdrawRatioERC20(pcvDeposit.address, token.address, userAddress, '10000', {}),
          'CoreRef: Caller is not a PCV controller'
        );
      });
    });

    describe('paused', function () {
      it('reverts', async function () {
        await pcvController.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(
          pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(pcvDeposit.address, token.address, userAddress, '10000', {}),
          'Pausable: paused'
        );
      });
    });
  });
});
