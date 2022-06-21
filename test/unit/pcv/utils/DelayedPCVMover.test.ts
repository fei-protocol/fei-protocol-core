import { Core, DelayedPCVMover, MockERC20, MockPCVDepositV2, RatioPCVControllerV2 } from '@custom-types/contracts';
import { NamedAddresses } from '@custom-types/types';
import { expectRevert, getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
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
  });
});
