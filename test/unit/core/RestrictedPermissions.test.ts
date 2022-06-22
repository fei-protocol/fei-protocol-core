import { expectRevert, getCore, getAddresses, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { Core, MockCoreRef, RestrictedPermissions } from '@custom-types/contracts';

describe('RestrictedPermissions', function () {
  let userAddress: string;
  let minterAddress: string;
  let burnerAddress: string;
  let pcvControllerAddress: string;
  let governorAddress: string;
  let guardianAddress: string;
  let core: Core;
  let coreRef: MockCoreRef;
  let restrictedPermissions: RestrictedPermissions;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.guardianAddress
    ];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, minterAddress, burnerAddress, pcvControllerAddress, governorAddress, guardianAddress } =
      await getAddresses());
    core = await getCore();

    const restrictedPermissionsFactory = await ethers.getContractFactory('MockRestrictedPermissions');
    restrictedPermissions = await restrictedPermissionsFactory.deploy(
      core.address,
      await core.fei(),
      await core.tribe()
    );

    const coreRefFactory = await ethers.getContractFactory('MockCoreRef');
    coreRef = await coreRefFactory.deploy(restrictedPermissions.address);
  });

  describe('Minter', function () {
    it('onlyMinter from minter succeeds', async function () {
      expect(await restrictedPermissions.isMinter(minterAddress)).to.be.true;
      await coreRef.connect(impersonatedSigners[minterAddress]).testMinter({});
    });

    it('onlyMinter from non-minter reverts', async function () {
      expect(await restrictedPermissions.isMinter(userAddress)).to.be.false;
      await expectRevert(
        coreRef.connect(impersonatedSigners[userAddress]).testMinter({}),
        'CoreRef: Caller is not a minter'
      );
    });
  });

  describe('Guardian', function () {
    it('onlyGuardian from guardian succeeds', async function () {
      expect(await restrictedPermissions.isGuardian(guardianAddress)).to.be.true;
      await coreRef.connect(impersonatedSigners[guardianAddress]).testGuardian({});
    });

    it('onlyGuardian from non-guardian reverts', async function () {
      expect(await restrictedPermissions.isGuardian(userAddress)).to.be.false;
      await expectRevert(
        coreRef.connect(impersonatedSigners[userAddress]).testGuardian({}),
        'CoreRef: Caller is not a guardian or governor'
      );
    });
  });

  describe('Governor', function () {
    it('onlyGovernor from governor reverts', async function () {
      expect(await core.isGovernor(governorAddress)).to.be.true;
      expect(await restrictedPermissions.isGovernor(governorAddress)).to.be.false;
      await expectRevert(
        coreRef.connect(impersonatedSigners[governorAddress]).testGovernor({}),
        'CoreRef: Caller is not a governor'
      );
    });

    it('onlyGovernor from non-governor reverts', async function () {
      expect(await core.isGovernor(userAddress)).to.be.false;
      expect(await restrictedPermissions.isGovernor(userAddress)).to.be.false;
      await expectRevert(
        coreRef.connect(impersonatedSigners[userAddress]).testGovernor({}),
        'CoreRef: Caller is not a governor'
      );
    });
  });

  describe('Burner', function () {
    it('onlyBurner from burner reverts', async function () {
      await expectRevert(
        coreRef.connect(impersonatedSigners[burnerAddress]).testBurner({}),
        'RestrictedPermissions: Burner deprecated for contract'
      );
    });

    it('onlyBurner from non-burner reverts', async function () {
      await expectRevert(
        coreRef.connect(impersonatedSigners[userAddress]).testBurner({}),
        'RestrictedPermissions: Burner deprecated for contract'
      );
    });
  });

  describe('PCVController', function () {
    it('onlyPCVController from PCVController reverts', async function () {
      await expectRevert(
        coreRef.connect(impersonatedSigners[pcvControllerAddress]).testPCVController({}),
        'RestrictedPermissions: PCV Controller deprecated for contract'
      );
    });

    it('onlyPCVController from non-PCV Controller reverts', async function () {
      await expectRevert(
        coreRef.connect(impersonatedSigners[userAddress]).testPCVController({}),
        'RestrictedPermissions: PCV Controller deprecated for contract'
      );
    });
  });
});
