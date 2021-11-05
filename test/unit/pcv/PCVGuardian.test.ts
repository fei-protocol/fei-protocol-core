import { getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { ethers } from 'hardhat';
import {
  Core,
  MockERC20__factory,
  MockPCVDepositV2__factory,
  PCVDeposit,
  PCVGuardian,
  MockERC20
} from '@custom-types/contracts';
import chai from 'chai';
import { PCVGuardian__factory } from '@custom-types/contracts/factories/PCVGuardian__factory';
import { forceEth } from '@test/integration/setup/utils';

// This will theoretically make the error stack actually print!
chai.config.includeStack = true;

// Import if needed, just a helper.
// const toBN = ethers.BigNumber.from;

describe('PCV Guardian', function () {
  // variable decs for vars that you want to use in multiple tests
  // typeing contracts specifically to what kind they are will catch before you run them!
  let core: Core;
  let pcvGuardian: PCVGuardian;

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
    userAddress2 = addresses.userAddress2;
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
    const pcvGuardianFactory = new PCVGuardian__factory(impersonatedSigners[userAddress]);
    pcvGuardian = await pcvGuardianFactory.deploy(core.address);

    // To deploy a contract, import and use the contract factory specific to that contract
    // note that the signer supplied is optional
  });

  // Try and do as much deployment in beforeEach, and as much testing in the actual functions

  describe('initial conditions', async () => {
    it('should have no safe addresses upon deployment', async () => {
      expect(await pcvGuardian.getSafeAddresses()).to.be.empty;
    });
  });

  describe('access control', async () => {
    it('should revert when calling setSafeAddress from a non-governor address', async () => {
      await expect(pcvGuardian.setSafeAddress(userAddress)).to.be.revertedWith('CoreRef: Caller is not a governor');
    });

    it('should revert when calling unsetSafeAddress from a non-guardian-or-governor address', async () => {
      await expect(pcvGuardian.unsetSafeAddress(userAddress)).to.be.revertedWith(
        'CoreRef: Caller is not a guardian or governor'
      );
    });

    it('should revert when calling withdrawToSafeAddress from a non-guardian-or-governor address', async () => {
      await expect(pcvGuardian.withdrawToSafeAddress(userAddress, userAddress, 1, false, false)).to.be.revertedWith(
        'CoreRef: Caller is not a guardian or governor'
      );
    });

    it('should revert when calling withdrawETHToSafeAddress from a non-guardian-or-governor address', async () => {
      await expect(pcvGuardian.withdrawETHToSafeAddress(userAddress, userAddress, 1, false, false)).to.be.revertedWith(
        'CoreRef: Caller is not a guardian or governor'
      );
    });

    it('should revert when calling withdrawERC20ToSafeAddress from a non-guardian-or-governor address', async () => {
      await expect(
        pcvGuardian.withdrawERC20ToSafeAddress(userAddress, userAddress, userAddress, 1, false, false)
      ).to.be.revertedWith('CoreRef: Caller is not a guardian or governor');
    });

    it('should allow the governor to add a safe address', async () => {
      await pcvGuardian.connect(impersonatedSigners[governorAddress]).setSafeAddress(userAddress);
      expect(await pcvGuardian.isSafeAddress(userAddress)).to.be.true;
    });

    it('should allow the guardian to remove a safe address', async () => {
      await pcvGuardian.connect(impersonatedSigners[guardianAddress]).unsetSafeAddress(userAddress);
      expect(await pcvGuardian.isSafeAddress(userAddress)).to.be.false;
    });
  });

  describe('withdrawals', async () => {
    let token: MockERC20;
    let tokenPCVDeposit: PCVDeposit;

    beforeEach(async () => {
      const tokenFactory = new MockERC20__factory(impersonatedSigners[userAddress]);
      const pcvDepositFactory = new MockPCVDepositV2__factory(impersonatedSigners[userAddress]);

      token = await tokenFactory.deploy();
      tokenPCVDeposit = await pcvDepositFactory.deploy(core.address, token.address, 1, 0);

      await token.mint(tokenPCVDeposit.address, 100);
      await forceEth(tokenPCVDeposit.address);

      await pcvGuardian.connect(impersonatedSigners[governorAddress]).setSafeAddress(userAddress);
      await core.connect(impersonatedSigners[governorAddress]).grantPCVController(pcvGuardian.address);
      await core.connect(impersonatedSigners[governorAddress]).grantGuardian(pcvGuardian.address);
    });

    it('should not be able to withdraw to a non-safe address', async () => {
      await expect(
        pcvGuardian
          .connect(impersonatedSigners[guardianAddress])
          .withdrawToSafeAddress(token.address, token.address, 1, false, false)
      ).to.be.revertedWith('Provided address is not a safe address!');
    });

    it('should withdraw from a token-pcv deposit when called by the guardian', async () => {
      await pcvGuardian
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, false, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
    });

    it('should withdrawETH from a pcv deposit when called by the guardian', async () => {
      const balanceBefore = await ethers.provider.getBalance(userAddress);
      await pcvGuardian
        .connect(impersonatedSigners[guardianAddress])
        .withdrawETHToSafeAddress(tokenPCVDeposit.address, userAddress, 1, false, false);
      const balanceAfter = await ethers.provider.getBalance(userAddress);

      expect(balanceAfter.sub(balanceBefore)).to.eq(1);
    });

    it('should withdrawERC20 from a pcv deposit when called by the guardian', async () => {
      await pcvGuardian
        .connect(impersonatedSigners[guardianAddress])
        .withdrawERC20ToSafeAddress(tokenPCVDeposit.address, userAddress, token.address, 1, false, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
    });

    it('should withdraw and unpause beforehand', async () => {
      await tokenPCVDeposit.connect(impersonatedSigners[guardianAddress]).pause();
      await pcvGuardian
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, true, false);
      expect(await token.balanceOf(userAddress)).to.eq(1);
      expect(await tokenPCVDeposit.paused()).to.be.false;
    });

    it('should withdraw and pause after', async () => {
      await pcvGuardian
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, false, true);
      expect(await token.balanceOf(userAddress)).to.eq(1);
      expect(await tokenPCVDeposit.paused()).to.be.true;
    });

    it('should withdraw, unpause before, and pause after', async () => {
      await tokenPCVDeposit.connect(impersonatedSigners[guardianAddress]).pause();
      await pcvGuardian
        .connect(impersonatedSigners[guardianAddress])
        .withdrawToSafeAddress(tokenPCVDeposit.address, userAddress, 1, true, true);
      expect(await token.balanceOf(userAddress)).to.eq(1);
      expect(await tokenPCVDeposit.paused()).to.be.true;
    });
  });
});
