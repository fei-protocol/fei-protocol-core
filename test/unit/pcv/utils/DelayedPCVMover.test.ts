import { Core, DelayedPCVMover, RatioPCVControllerV2, MockERC20, MockPCVDepositV2 } from '@custom-types/contracts';
import { NamedAddresses } from '@custom-types/types';
import { getCore, getAddresses, expectRevert, time, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';

describe('DelayedPCVMover', function () {
  let addresses: NamedAddresses;
  let core: Core;
  let token: MockERC20;
  let pcvController: RatioPCVControllerV2;
  let deposit: MockPCVDepositV2;
  let mover: DelayedPCVMover;
  const deadline = Math.floor((Date.now() + 24 * 36e5) / 1000).toString();

  before(async () => {
    addresses = await getAddresses();
  });

  beforeEach(async function () {
    core = await getCore();
    token = await (await ethers.getContractFactory('MockERC20')).deploy();
    pcvController = await (await ethers.getContractFactory('RatioPCVControllerV2')).deploy(core.address);

    deposit = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(
      core.address,
      token.address,
      '1000', // token
      '0' // fei
    );
    await token.mint(deposit.address, '1000');

    mover = await (
      await ethers.getContractFactory('DelayedPCVMover')
    ).deploy(core.address, deadline, pcvController.address, deposit.address, addresses.userAddress, '10000');
  });

  describe('init', function () {
    it('deadline()', async function () {
      expect(await mover.deadline()).to.be.equal(deadline);
    });
    it('controller()', async function () {
      expect(await mover.controller()).to.be.equal(pcvController.address);
    });
    it('deposit()', async function () {
      expect(await mover.deposit()).to.be.equal(deposit.address);
    });
    it('target()', async function () {
      expect(await mover.target()).to.be.equal(addresses.userAddress);
    });
    it('basisPoints()', async function () {
      expect(await mover.basisPoints()).to.be.equal('10000');
    });
  });

  describe('withdrawRatio()', function () {
    it('should revert if paused', async function () {
      await mover.connect(await getImpersonatedSigner(addresses.governorAddress)).pause();
      await expectRevert(mover.withdrawRatio(), 'Pausable: paused');
    });
    it('should revert before deadline', async function () {
      await expectRevert(mover.withdrawRatio(), 'DelayedPCVMover: deadline not reached');
    });

    describe('after deadline', function () {
      before(async function () {
        await time.increaseTo(deadline);
      });

      it('should revert if role not granted', async function () {
        await expectRevert(mover.withdrawRatio(), 'CoreRef: Caller is not a PCV controller');
      });
      it('should succeed after deadline', async function () {
        await core.connect(await getImpersonatedSigner(addresses.governorAddress)).grantPCVController(mover.address);
        expect(await token.balanceOf(deposit.address)).to.be.equal('1000');
        expect(await token.balanceOf(addresses.userAddress)).to.be.equal('0');
        await mover.withdrawRatio();
        expect(await token.balanceOf(deposit.address)).to.be.equal('0');
        expect(await token.balanceOf(addresses.userAddress)).to.be.equal('1000');
      });
      it('should revoke PCV_CONTROLLER_ROLE role from self after movement', async function () {
        await core.connect(await getImpersonatedSigner(addresses.governorAddress)).grantPCVController(mover.address);
        expect(await core.isPCVController(mover.address)).to.be.true;
        await mover.withdrawRatio();
        expect(await core.isPCVController(mover.address)).to.be.false;
      });
    });
  });
});
