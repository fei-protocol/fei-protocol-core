import {
  expectRevert,
  balance,
  getAddresses,
  getCore,
  getImpersonatedSigner,
  deployDevelopmentWeth
} from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { BigNumber, Signer } from 'ethers';
import {
  MockEthUniswapPCVDeposit,
  MockPCVDepositV2,
  WETH9,
  Core,
  RatioPCVControllerV2,
  MockERC20
} from '@custom-types/contracts';

const toBN = ethers.BigNumber.from;

describe.skip('RatioPCVControllerV2', function () {
  let userAddress: string;
  let governorAddress: string;
  let pcvControllerAddress: string;
  let pcvDepositEth: MockEthUniswapPCVDeposit;
  let pcvDepositWeth: MockPCVDepositV2;
  let weth: WETH9;
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

    await deployDevelopmentWeth();
  });

  beforeEach(async function () {
    ({ userAddress, governorAddress, pcvControllerAddress } = await getAddresses());
    core = await getCore();
    token = await (await ethers.getContractFactory('MockERC20')).deploy();
    weth = await ethers.getContractAt('WETH9', '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2');

    pcvController = await (await ethers.getContractFactory('RatioPCVControllerV2')).deploy(core.address);

    pcvDepositEth = await (await ethers.getContractFactory('MockEthUniswapPCVDeposit')).deploy(userAddress);
    await pcvDepositEth.setBeneficiary(pcvDepositEth.address);

    pcvAmount = toBN('10000000000');

    pcvDepositWeth = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(core.address, weth.address, pcvAmount, '0');

    await impersonatedSigners[userAddress].sendTransaction({
      from: userAddress,
      to: pcvDepositEth.address,
      value: pcvAmount
    });
    await weth.connect(impersonatedSigners[userAddress]).deposit({ value: pcvAmount });
    await weth.connect(impersonatedSigners[userAddress]).transfer(pcvDepositWeth.address, pcvAmount);
  });

  describe('Functions that call withdraw()', function () {
    describe('withdrawRatio()', function () {
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await balance.current(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(pcvDepositEth.address, userAddress, '10000', {});
          const userBalanceAfter = await balance.current(userAddress);
          const reserveBalanceAfter = await balance.current(pcvDepositEth.address);

          expect(reserveBalanceAfter.toString()).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });

        it('50%', async function () {
          const userBalanceBefore = await balance.current(userAddress);
          const reserveBalanceBefore = await balance.current(pcvDepositEth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(pcvDepositEth.address, userAddress, '5000', {});
          const userBalanceAfter = await balance.current(userAddress);
          const reserveBalanceAfter = await balance.current(pcvDepositEth.address);

          expect(toBN(reserveBalanceBefore.sub(reserveBalanceAfter).toString())).to.be.equal(pcvAmount.div(toBN(2)));
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.div(toBN(2)).toString());
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatio(pcvDepositEth.address, userAddress, '20000', {}),
            'RatioPCVController: basisPoints too high'
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatio(pcvDepositEth.address, userAddress, '10000', {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatio(pcvDepositEth.address, userAddress, '10000', {}),
            'RatioPCVController: no value to withdraw'
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .withdrawRatio(pcvDepositEth.address, userAddress, '10000', {}),
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
              .withdrawRatio(pcvDepositEth.address, userAddress, '10000', {}),
            'Pausable: paused'
          );
        });
      });
    });

    describe('withdrawRatioUnwrapWETH()', function () {
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await balance.current(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioUnwrapWETH(pcvDepositWeth.address, userAddress, '10000', {});
          const userBalanceAfter = await balance.current(userAddress);
          const reserveBalanceAfter = await weth.balanceOf(pcvDepositWeth.address);

          expect(reserveBalanceAfter.toString()).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });

        it('50%', async function () {
          const userBalanceBefore = await balance.current(userAddress);
          const reserveBalanceBefore = await weth.balanceOf(pcvDepositWeth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioUnwrapWETH(pcvDepositWeth.address, userAddress, '5000', {});
          const userBalanceAfter = await balance.current(userAddress);
          const reserveBalanceAfter = await weth.balanceOf(pcvDepositWeth.address);

          expect(toBN(reserveBalanceBefore.sub(reserveBalanceAfter).toString())).to.be.equal(pcvAmount.div(toBN(2)));
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.div(toBN(2)).toString());
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatioUnwrapWETH(pcvDepositWeth.address, userAddress, '20000', {}),
            'RatioPCVController: basisPoints too high'
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioUnwrapWETH(pcvDepositWeth.address, userAddress, '10000', {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatioUnwrapWETH(pcvDepositWeth.address, userAddress, '10000', {}),
            'RatioPCVController: no value to withdraw'
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .withdrawRatioUnwrapWETH(pcvDepositWeth.address, userAddress, '10000', {}),
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
              .withdrawRatioUnwrapWETH(pcvDepositWeth.address, userAddress, '10000', {}),
            'Pausable: paused'
          );
        });
      });
    });

    describe('withdrawRatioWrapETH()', function () {
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await weth.balanceOf(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioWrapETH(pcvDepositEth.address, userAddress, '10000', {});
          const userBalanceAfter = await weth.balanceOf(userAddress);
          const reserveBalanceAfter = await balance.current(pcvDepositEth.address);

          expect(reserveBalanceAfter.toString()).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });

        it('50%', async function () {
          const userBalanceBefore = await weth.balanceOf(userAddress);
          const reserveBalanceBefore = await balance.current(pcvDepositEth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioWrapETH(pcvDepositEth.address, userAddress, '5000', {});
          const userBalanceAfter = await weth.balanceOf(userAddress);
          const reserveBalanceAfter = await balance.current(pcvDepositEth.address);

          expect(toBN(reserveBalanceBefore.sub(reserveBalanceAfter).toString())).to.be.equal(pcvAmount.div(toBN(2)));
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.div(toBN(2)).toString());
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatioWrapETH(pcvDepositEth.address, userAddress, '20000', {}),
            'RatioPCVController: basisPoints too high'
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioWrapETH(pcvDepositEth.address, userAddress, '10000', {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatioWrapETH(pcvDepositEth.address, userAddress, '10000', {}),
            'RatioPCVController: no value to withdraw'
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .withdrawRatioWrapETH(pcvDepositEth.address, userAddress, '10000', {}),
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
              .withdrawRatioWrapETH(pcvDepositEth.address, userAddress, '10000', {}),
            'Pausable: paused'
          );
        });
      });
    });

    describe('withdrawUnwrapWETH()', function () {
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await balance.current(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawUnwrapWETH(pcvDepositWeth.address, userAddress, pcvAmount.toString(), {});
          const userBalanceAfter = await balance.current(userAddress);
          const reserveBalanceAfter = await weth.balanceOf(pcvDepositWeth.address);

          expect(reserveBalanceAfter.toString()).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });

        it('50%', async function () {
          const userBalanceBefore = await balance.current(userAddress);
          const reserveBalanceBefore = await weth.balanceOf(pcvDepositWeth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawUnwrapWETH(pcvDepositWeth.address, userAddress, pcvAmount.div(toBN(2)), {});
          const userBalanceAfter = await balance.current(userAddress);
          const reserveBalanceAfter = await weth.balanceOf(pcvDepositWeth.address);

          expect(toBN(reserveBalanceBefore.sub(reserveBalanceAfter).toString())).to.be.equal(pcvAmount.div(toBN(2)));
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.div(toBN(2)).toString());
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawUnwrapWETH(pcvDepositWeth.address, userAddress, pcvAmount.mul(toBN(2)), {}),
            ''
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawUnwrapWETH(pcvDepositWeth.address, userAddress, pcvAmount.toString(), {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawUnwrapWETH(pcvDepositWeth.address, userAddress, pcvAmount.toString(), {}),
            ''
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .withdrawUnwrapWETH(pcvDepositWeth.address, userAddress, pcvAmount.toString(), {}),
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
              .withdrawUnwrapWETH(pcvDepositWeth.address, userAddress, pcvAmount.toString(), {}),
            'Pausable: paused'
          );
        });
      });
    });

    describe('withdrawWrapETH()', function () {
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await weth.balanceOf(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawWrapETH(pcvDepositEth.address, userAddress, pcvAmount.toString(), {});
          const userBalanceAfter = await weth.balanceOf(userAddress);
          const reserveBalanceAfter = await balance.current(pcvDepositEth.address);

          expect(reserveBalanceAfter.toString()).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });

        it('50%', async function () {
          const userBalanceBefore = await weth.balanceOf(userAddress);
          const reserveBalanceBefore = await balance.current(pcvDepositEth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawWrapETH(pcvDepositEth.address, userAddress, pcvAmount.div(toBN(2)), {});
          const userBalanceAfter = await weth.balanceOf(userAddress);
          const reserveBalanceAfter = await balance.current(pcvDepositEth.address);

          expect(toBN(reserveBalanceBefore.sub(reserveBalanceAfter).toString())).to.be.equal(pcvAmount.div(toBN(2)));
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.div(toBN(2)).toString());
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawWrapETH(pcvDepositEth.address, userAddress, pcvAmount.mul(toBN(2)), {}),
            'MockEthPCVDeposit: Not enough value held'
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawWrapETH(pcvDepositEth.address, userAddress, pcvAmount.toString(), {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawWrapETH(pcvDepositEth.address, userAddress, pcvAmount.toString(), {}),
            'MockEthPCVDeposit: Not enough value held'
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .withdrawWrapETH(pcvDepositEth.address, userAddress, pcvAmount.toString(), {}),
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
              .withdrawWrapETH(pcvDepositEth.address, userAddress, pcvAmount.toString(), {}),
            'Pausable: paused'
          );
        });
      });
    });
  });

  describe('Functions that call withdrawERC20()', function () {
    describe('withdrawRatioERC20()', function () {
      beforeEach(async function () {
        await token.mint(pcvDepositEth.address, pcvAmount);
      });
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await token.balanceOf(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(pcvDepositEth.address, token.address, userAddress, '10000', {});
          const userBalanceAfter = await token.balanceOf(userAddress);
          const reserveBalanceAfter = await token.balanceOf(pcvDepositEth.address);

          expect(reserveBalanceAfter).to.be.equal(toBN('0'));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount);
        });

        it('50%', async function () {
          const userBalanceBefore = await token.balanceOf(userAddress);
          const reserveBalanceBefore = await token.balanceOf(pcvDepositEth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(pcvDepositEth.address, token.address, userAddress, '5000', {});
          const userBalanceAfter = await token.balanceOf(userAddress);
          const reserveBalanceAfter = await token.balanceOf(pcvDepositEth.address);

          expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(pcvAmount.div(toBN('2')));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount.div(toBN('2')));
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatioERC20(pcvDepositEth.address, token.address, userAddress, '20000', {}),
            'RatioPCVController: basisPoints too high'
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .withdrawRatioERC20(pcvDepositEth.address, token.address, userAddress, '10000', {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .withdrawRatioERC20(pcvDepositEth.address, token.address, userAddress, '10000', {}),
            'RatioPCVController: no value to withdraw'
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .withdrawRatioERC20(pcvDepositEth.address, token.address, userAddress, '10000', {}),
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
              .withdrawRatioERC20(pcvDepositEth.address, token.address, userAddress, '10000', {}),
            'Pausable: paused'
          );
        });
      });
    });
  });

  describe('Functions that call safeTransferFrom()', function () {
    describe('transferFrom()', function () {
      beforeEach(async function () {
        await token.mint(pcvDepositEth.address, pcvAmount);

        // approve
        const signer = await getImpersonatedSigner(pcvDepositEth.address);
        await forceEth(pcvDepositEth.address);
        await token.connect(signer).approve(pcvController.address, pcvAmount);
      });
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await token.balanceOf(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount, {});
          const userBalanceAfter = await token.balanceOf(userAddress);
          const reserveBalanceAfter = await token.balanceOf(pcvDepositEth.address);

          expect(reserveBalanceAfter).to.be.equal(toBN('0'));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount);
        });

        it('50%', async function () {
          const userBalanceBefore = await token.balanceOf(userAddress);
          const reserveBalanceBefore = await token.balanceOf(pcvDepositEth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount.div(toBN('2')), {});
          const userBalanceAfter = await token.balanceOf(userAddress);
          const reserveBalanceAfter = await token.balanceOf(pcvDepositEth.address);

          expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(pcvAmount.div(toBN('2')));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount.div(toBN('2')));
        });

        it('more than approval reverts', async function () {
          // approve
          const signer = await getImpersonatedSigner(pcvDepositEth.address);
          await forceEth(pcvDepositEth.address);
          await token.connect(signer).approve(pcvController.address, pcvAmount.div(toBN('2')));

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount, {}),
            'ERC20: transfer amount exceeds allowance'
          );
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount.mul(toBN('2')), {}),
            'ERC20: transfer amount exceeds balance'
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount, {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount, {}),
            'ERC20: transfer amount exceeds balance'
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount, {}),
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
              .transferFrom(pcvDepositEth.address, token.address, userAddress, pcvAmount, {}),
            'Pausable: paused'
          );
        });
      });
    });

    describe('transferFromRatio()', function () {
      beforeEach(async function () {
        await token.mint(pcvDepositEth.address, pcvAmount);

        // approve
        const signer = await getImpersonatedSigner(pcvDepositEth.address);
        await forceEth(pcvDepositEth.address);
        await token.connect(signer).approve(pcvController.address, pcvAmount);
      });
      describe('from pcvController', function () {
        it('100%', async function () {
          const userBalanceBefore = await token.balanceOf(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '10000', {});
          const userBalanceAfter = await token.balanceOf(userAddress);
          const reserveBalanceAfter = await token.balanceOf(pcvDepositEth.address);

          expect(reserveBalanceAfter).to.be.equal(toBN('0'));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount);
        });

        it('50%', async function () {
          const userBalanceBefore = await token.balanceOf(userAddress);
          const reserveBalanceBefore = await token.balanceOf(pcvDepositEth.address);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '5000', {});
          const userBalanceAfter = await token.balanceOf(userAddress);
          const reserveBalanceAfter = await token.balanceOf(pcvDepositEth.address);

          expect(reserveBalanceBefore.sub(reserveBalanceAfter)).to.be.equal(pcvAmount.div(toBN('2')));
          expect(userBalanceAfter.sub(userBalanceBefore)).to.be.equal(pcvAmount.div(toBN('2')));
        });

        it('more than approval reverts', async function () {
          // approve
          const signer = await getImpersonatedSigner(pcvDepositEth.address);
          await forceEth(pcvDepositEth.address);
          await token.connect(signer).approve(pcvController.address, pcvAmount.div(toBN('2')));

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '10000', {}),
            'ERC20: transfer amount exceeds allowance'
          );
        });

        it('200% reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '20000', {}),
            'RatioPCVController: basisPoints too high'
          );
        });

        it('0 value reverts', async function () {
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '10000', {}); // withdraw all

          await expectRevert(
            pcvController
              .connect(impersonatedSigners[pcvControllerAddress])
              .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '10000', {}),
            'RatioPCVController: no value to transfer'
          );
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController
              .connect(impersonatedSigners[userAddress])
              .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '10000', {}),
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
              .transferFromRatio(pcvDepositEth.address, token.address, userAddress, '10000', {}),
            'Pausable: paused'
          );
        });
      });
    });
  });

  describe('Functions that move ETH and also wrap', function () {
    describe('transferETHAsWETH()', function () {
      beforeEach(async function () {
        await impersonatedSigners[userAddress].sendTransaction({
          from: userAddress,
          to: pcvController.address,
          value: pcvAmount
        });
      });

      describe('from pcvController', function () {
        it('succeeds', async function () {
          const userBalanceBefore = await weth.balanceOf(userAddress);
          await pcvController.connect(impersonatedSigners[pcvControllerAddress]).transferETHAsWETH(userAddress);
          const userBalanceAfter = await weth.balanceOf(userAddress);

          expect(await balance.current(pcvController.address)).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController.connect(impersonatedSigners[userAddress]).transferETHAsWETH(userAddress),
            'CoreRef: Caller is not a PCV controller'
          );
        });
      });

      describe('paused', function () {
        it('reverts', async function () {
          await pcvController.connect(impersonatedSigners[governorAddress]).pause({});
          await expectRevert(
            pcvController.connect(impersonatedSigners[pcvControllerAddress]).transferETHAsWETH(userAddress),
            'Pausable: paused'
          );
        });
      });
    });
  });

  describe('Functions that move WETH and also unwrap', function () {
    describe('transferWETHAsETH()', function () {
      beforeEach(async function () {
        await weth.connect(impersonatedSigners[userAddress]).deposit({ value: pcvAmount });
        await weth.connect(impersonatedSigners[userAddress]).transfer(pcvController.address, pcvAmount);
      });

      describe('from pcvController', function () {
        it('succeeds', async function () {
          expect(await weth.balanceOf(pcvController.address)).to.be.equal(pcvAmount);
          const userBalanceBefore = await balance.current(userAddress);
          await pcvController.connect(impersonatedSigners[pcvControllerAddress]).transferWETHAsETH(userAddress);
          const userBalanceAfter = await balance.current(userAddress);

          expect(await weth.balanceOf(pcvController.address)).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController.connect(impersonatedSigners[userAddress]).transferWETHAsETH(userAddress),
            'CoreRef: Caller is not a PCV controller'
          );
        });
      });

      describe('paused', function () {
        it('reverts', async function () {
          await pcvController.connect(impersonatedSigners[governorAddress]).pause({});
          await expectRevert(
            pcvController.connect(impersonatedSigners[pcvControllerAddress]).transferWETHAsETH(userAddress),
            'Pausable: paused'
          );
        });
      });
    });
  });

  describe('Functions that move ERC20 on the controller', function () {
    describe('transferERC20()', function () {
      beforeEach(async function () {
        await token.mint(pcvController.address, pcvAmount);
      });

      describe('from pcvController', function () {
        it('succeeds', async function () {
          const userBalanceBefore = await token.balanceOf(userAddress);
          await pcvController
            .connect(impersonatedSigners[pcvControllerAddress])
            .transferERC20(token.address, userAddress);
          const userBalanceAfter = await token.balanceOf(userAddress);

          expect(await token.balanceOf(pcvController.address)).to.be.equal('0');
          expect(userBalanceAfter.sub(userBalanceBefore).toString()).to.be.equal(pcvAmount.toString());
        });
      });

      describe('not from pcvController', function () {
        it('reverts', async function () {
          await expectRevert(
            pcvController.connect(impersonatedSigners[userAddress]).transferERC20(token.address, userAddress),
            'CoreRef: Caller is not a PCV controller'
          );
        });
      });

      describe('paused', function () {
        it('reverts', async function () {
          await pcvController.connect(impersonatedSigners[governorAddress]).pause({});
          await expectRevert(
            pcvController.connect(impersonatedSigners[pcvControllerAddress]).transferERC20(token.address, userAddress),
            'Pausable: paused'
          );
        });
      });
    });
  });
});
