import { expectRevert, getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import {
  Core,
  MockERC20__factory,
  MockPCVDepositV2__factory,
  PCVDeposit,
  PCVGuardian,
  MockERC20
} from '@custom-types/contracts';
import chai from 'chai';
import { forceEth } from '@test/integration/setup/utils';

// This will theoretically make the error stack actually print!
chai.config.includeStack = true;

// Import if needed, just a helper.
// const toBN = ethers.BigNumber.from;

describe('PCV Guardian', function () {
  // variable decs for vars that you want to use in multiple tests
  // typeing contracts specifically to what kind they are will catch before you run them!
  let core: Core;
  let pcvGuardianWithoutStartingAddresses: PCVGuardian;
  let pcvGuardianWithStartingAddresses: PCVGuardian;

  let userAddress: string;
  let userAddress2: string;
  let pcvControllerAddress: string;
  let governorAddress: string;
  let guardianAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    // add any addresses that you want to get here
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    userAddress2 = addresses.secondUserAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;
    guardianAddress = addresses.guardianAddress;

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [userAddress, pcvControllerAddress, governorAddress, guardianAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async () => {
    // If the forked-network state needs to be reset between each test, run this
    // await network.provider.request({method: 'hardhat_reset', params: []});

    // Do any pre-test setup here
    core = await getCore();

    const pcvGuardianFactory = await ethers.getContractFactory('PCVGuardian');

    pcvGuardianWithoutStartingAddresses = await pcvGuardianFactory.deploy(core.address, []);
    pcvGuardianWithStartingAddresses = await pcvGuardianFactory.deploy(core.address, [userAddress, userAddress2]);

    await pcvGuardianWithoutStartingAddresses.deployTransaction.wait();
    await pcvGuardianWithStartingAddresses.deployTransaction.wait();

    // To deploy a contract, import and use the contract factory specific to that contract
    // note that the signer supplied is optional
  });

  // Try and do as much deployment in beforeEach, and as much testing in the actual functions

  describe('initial conditions', async () => {
    it('should have no safe addresses upon deployment when deployed with no safe addresses', async () => {
      expect(await pcvGuardianWithoutStartingAddresses.getSafeAddresses()).to.be.empty;
    });

    it('should have safe addresses upon deployment when deployed with safe addresses', async () => {
      expect(await pcvGuardianWithStartingAddresses.getSafeAddresses()).not.to.be.empty;
    });
  });

  describe('access control', async () => {
    it('should revert when calling setSafeAddress & setSafeAddresses from a non-governor address', async () => {
      await expect(pcvGuardianWithoutStartingAddresses.setSafeAddress(userAddress)).to.be.revertedWith(
        'CoreRef: Caller is not a governor'
      );
      await expect(
        pcvGuardianWithoutStartingAddresses.setSafeAddresses([userAddress, userAddress2])
      ).to.be.revertedWith('CoreRef: Caller is not a governor');
    });

    it('should revert when calling unsetSafeAddress & unsetSafeAddresses from a non-guardian-or-governor-or-admin address', async () => {
      await expect(pcvGuardianWithoutStartingAddresses.unsetSafeAddress(userAddress)).to.be.revertedWith(
        'CoreRef: Caller is not governor or guardian or admin'
      );

      await expect(
        pcvGuardianWithoutStartingAddresses.unsetSafeAddresses([userAddress, userAddress2])
      ).to.be.revertedWith('CoreRef: Caller is not governor or guardian or admin');
    });

    it('should revert when calling withdrawToSafeAddress from a non-guardian-or-governor-or-admin address', async () => {
      await expect(
        pcvGuardianWithoutStartingAddresses.withdrawToSafeAddress(userAddress, userAddress, 1, false, false)
      ).to.be.revertedWith('CoreRef: Caller is not governor or guardian or admin');
    });

    it('should revert when calling withdrawETHToSafeAddress from a non-guardian-or-governor-or-admin address', async () => {
      await expect(
        pcvGuardianWithoutStartingAddresses.withdrawETHToSafeAddress(userAddress, userAddress, 1, false, false)
      ).to.be.revertedWith('CoreRef: Caller is not governor or guardian or admin');
    });

    it('should revert when calling withdrawERC20ToSafeAddress from a non-guardian-or-governor-or-admin address', async () => {
      await expect(
        pcvGuardianWithoutStartingAddresses.withdrawERC20ToSafeAddress(
          userAddress,
          userAddress,
          userAddress,
          1,
          false,
          false
        )
      ).to.be.revertedWith('CoreRef: Caller is not governor or guardian or admin');
    });

    it('should allow the governor to add a safe address', async () => {
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[governorAddress])
        .setSafeAddress(userAddress);
      expect(await pcvGuardianWithoutStartingAddresses.isSafeAddress(userAddress)).to.be.true;
    });

    it("can't set an already safe address", async () => {
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[governorAddress])
        .setSafeAddress(userAddress);
      expect(await pcvGuardianWithoutStartingAddresses.isSafeAddress(userAddress)).to.be.true;

      await expectRevert(
        pcvGuardianWithoutStartingAddresses.connect(impersonatedSigners[governorAddress]).setSafeAddress(userAddress),
        'set'
      );
    });

    it("can't unset an already unsafe address", async () => {
      await expectRevert(
        pcvGuardianWithoutStartingAddresses.connect(impersonatedSigners[governorAddress]).unsetSafeAddress(userAddress),
        'unset'
      );
    });

    it('should allow the guardian to remove a safe address', async () => {
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[governorAddress])
        .setSafeAddress(userAddress);
      expect(await pcvGuardianWithoutStartingAddresses.isSafeAddress(userAddress)).to.be.true;

      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .unsetSafeAddress(userAddress);
      expect(await pcvGuardianWithoutStartingAddresses.isSafeAddress(userAddress)).to.be.false;
    });
  });

  describe('withdrawals', async () => {
    let token: MockERC20;
    let tokenPCVDeposit: PCVDeposit;
    let tokenPCVDeposit2: PCVDeposit;

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositFactory = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      tokenPCVDeposit = await pcvDepositFactory.deploy(core.address, token.address, 1, 0);
      tokenPCVDeposit2 = await pcvDepositFactory.deploy(core.address, token.address, 1, 0);

      await token.mint(tokenPCVDeposit.address, 100);
      await forceEth(tokenPCVDeposit.address);

      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[governorAddress])
        .setSafeAddress(userAddress);
      await core
        .connect(impersonatedSigners[governorAddress])
        .grantPCVController(pcvGuardianWithoutStartingAddresses.address);
      await core
        .connect(impersonatedSigners[governorAddress])
        .grantGuardian(pcvGuardianWithoutStartingAddresses.address);
    });

    it('should not be able to withdraw to a non-safe address', async () => {
      await expect(
        pcvGuardianWithoutStartingAddresses
          .connect(impersonatedSigners[guardianAddress])
          .withdrawToSafeAddress(token.address, token.address, 1, false, false)
      ).to.be.revertedWith('Provided address is not a safe address!');
    });

    it('should withdraw from a token-pcv deposit when called by the guardian', async () => {
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, false, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
    });

    it('should withdraw from a token-pcv deposit and deposit after', async () => {
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[governorAddress])
        .setSafeAddress(tokenPCVDeposit2.address);
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, tokenPCVDeposit2.address, 1, false, true);
      expect(await token.balanceOf(tokenPCVDeposit2.address)).to.eq(1);
    });

    it('should withdrawETH from a pcv deposit when called by the guardian', async () => {
      const balanceBefore = await ethers.provider.getBalance(userAddress);
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .withdrawETHToSafeAddress(tokenPCVDeposit.address, userAddress, 1, false, false);
      const balanceAfter = await ethers.provider.getBalance(userAddress);

      expect(balanceAfter.sub(balanceBefore)).to.eq(1);
    });

    it('should withdrawERC20 from a pcv deposit when called by the guardian', async () => {
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .withdrawERC20ToSafeAddress(tokenPCVDeposit.address, userAddress, token.address, 1, false, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
    });

    it('should withdraw and unpause beforehand', async () => {
      await tokenPCVDeposit.connect(impersonatedSigners[guardianAddress]).pause();
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, false, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
      expect(await tokenPCVDeposit.paused()).to.be.false;
    });

    it('should withdraw and pause after', async () => {
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, true, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
      expect(await tokenPCVDeposit.paused()).to.be.true;
    });

    it('should withdraw, unpause before, and pause after', async () => {
      await tokenPCVDeposit.connect(impersonatedSigners[guardianAddress]).pause();
      await pcvGuardianWithoutStartingAddresses
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, true, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
      expect(await tokenPCVDeposit.paused()).to.be.true;
    });
  });
});
