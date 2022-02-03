import { expectRevert, time, balance, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

describe('PCVDripController', function () {
  let userAddress;
  let governorAddress;
  let beneficiaryAddress1;

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
    ({ beneficiaryAddress1, userAddress, governorAddress } = await getAddresses());

    this.core = await getCore();
    this.fei = await ethers.getContractAt('Fei', await this.core.fei());

    this.sourcePCVDeposit = await (
      await ethers.getContractFactory('MockEthUniswapPCVDeposit')
    ).deploy(beneficiaryAddress1);
    this.pcvDeposit = await (await ethers.getContractFactory('MockEthUniswapPCVDeposit')).deploy(beneficiaryAddress1);
    this.dripAmount = toBN('500000000000000000');
    this.incentiveAmount = toBN('100000000000000000');

    this.pcvDripper = await (
      await ethers.getContractFactory('PCVDripController')
    ).deploy(
      this.core.address,
      this.sourcePCVDeposit.address,
      this.pcvDeposit.address,
      '1000',
      this.dripAmount,
      this.incentiveAmount
    );
    await this.core.connect(impersonatedSigners[governorAddress]).grantMinter(this.pcvDripper.address, {});

    await impersonatedSigners[userAddress].sendTransaction({
      to: this.sourcePCVDeposit.address,
      value: toBN('1000000000000000000')
    });
  });

  describe('Drip', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await time.increase(1000);
        await this.pcvDripper.connect(impersonatedSigners[governorAddress]).pause({});
        await expectRevert(this.pcvDripper.drip(), 'Pausable: paused');
      });
    });

    describe('Before time', function () {
      it('reverts', async function () {
        await expectRevert(this.pcvDripper.drip(), 'Timed: time not ended');
      });
    });

    describe('After time', function () {
      beforeEach(async function () {
        await time.increase(1000);
      });
      describe('Target balance low enough', function () {
        it('succeeds', async function () {
          const dripperBalanceBefore = await this.sourcePCVDeposit.balance();
          const beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
          await this.pcvDripper.drip();
          const dripperBalanceAfter = await this.sourcePCVDeposit.balance();
          const beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);

          expect(dripperBalanceBefore.sub(dripperBalanceAfter).toString()).to.be.equal(this.dripAmount.toString());
          expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore).toString()).to.be.equal(
            this.dripAmount.toString()
          );

          // timer reset
          expect(await this.pcvDripper.isTimeEnded()).to.be.equal(false);
        });
        describe('Target balance low enough', function () {
          it('succeeds', async function () {
            const sourceBalanceBefore = await this.sourcePCVDeposit.balance();
            const beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
            await this.pcvDripper.drip();
            const sourceBalanceAfter = await this.sourcePCVDeposit.balance();
            const beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);

            expect(sourceBalanceBefore.sub(sourceBalanceAfter).toString()).to.be.equal(this.dripAmount.toString());
            expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore).toString()).to.be.equal(
              this.dripAmount.toString()
            );

            // timer reset
            expect(await this.pcvDripper.isTimeEnded()).to.be.equal(false);
          });
        });

        describe('Target balance too high', function () {
          beforeEach(async function () {
            await impersonatedSigners[userAddress].sendTransaction({
              to: this.pcvDeposit.address,
              value: this.dripAmount
            });
          });

          it('reverts', async function () {
            await expectRevert(this.pcvDripper.drip(), 'PCVDripController: not eligible');
          });
        });
      });
    });

    describe('Second attempt', function () {
      beforeEach(async function () {
        await time.increase(1000);
        await this.pcvDripper.drip();
      });

      describe('Before time', function () {
        it('reverts', async function () {
          await expectRevert(this.pcvDripper.drip(), 'Timed: time not ended');
        });
      });

      describe('After time', function () {
        describe('Target balance low enough', function () {
          beforeEach(async function () {
            await this.pcvDeposit.withdraw(userAddress, this.dripAmount);
            await time.increase(1000);
          });
          it('succeeds', async function () {
            const sourceBalanceBefore = await this.sourcePCVDeposit.balance();
            const beneficiaryBalanceBefore = await balance.current(this.pcvDeposit.address);
            await this.pcvDripper.drip();
            const sourceBalanceAfter = await this.sourcePCVDeposit.balance();
            const beneficiaryBalanceAfter = await balance.current(this.pcvDeposit.address);

            expect(sourceBalanceBefore.sub(sourceBalanceAfter).toString()).to.be.equal(this.dripAmount.toString());
            expect(beneficiaryBalanceAfter.sub(beneficiaryBalanceBefore).toString()).to.be.equal(
              this.dripAmount.toString()
            );

            // timer reset
            expect(await this.pcvDripper.isTimeEnded()).to.be.equal(false);
          });
        });

        describe('Target balance too high', function () {
          beforeEach(async function () {
            await impersonatedSigners[userAddress].sendTransaction({
              to: this.pcvDeposit.address,
              value: this.dripAmount
            });
            await time.increase(1000);
          });

          it('reverts', async function () {
            await expectRevert(this.pcvDripper.drip(), 'PCVDripController: not eligible');
          });
        });
      });
    });
    describe('Set dripAmount', function () {
      it('governor succeeds', async function () {
        await this.pcvDripper.connect(impersonatedSigners[governorAddress]).setDripAmount('10000', {});
        expect(await this.pcvDripper.dripAmount()).to.be.equal(toBN('10000'));
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          this.pcvDripper.connect(impersonatedSigners[userAddress]).setDripAmount('10000', {}),
          'CoreRef: Caller is not a governor'
        );
      });
    });
    describe('Set Source', function () {
      it('governor succeeds', async function () {
        await this.pcvDripper.connect(impersonatedSigners[governorAddress]).setSource(userAddress, {});
        expect(await this.pcvDripper.source()).to.be.equal(userAddress);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          this.pcvDripper.connect(impersonatedSigners[userAddress]).setSource(userAddress, {}),
          'CoreRef: Caller is not a governor'
        );
      });
    });
    describe('Set USD per FEI', function () {
      it('governor succeeds', async function () {
        await this.pcvDripper.connect(impersonatedSigners[governorAddress]).setTarget(userAddress, {});
        expect(await this.pcvDripper.target()).to.be.equal(userAddress);
      });

      it('non-governor reverts', async function () {
        await expectRevert(
          this.pcvDripper.connect(impersonatedSigners[userAddress]).setTarget(userAddress, {}),
          'CoreRef: Caller is not a governor'
        );
      });
    });
  });
});
