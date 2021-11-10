import { expectRevert, getAddresses, getCore, ZERO_ADDRESS } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer, utils } from 'ethers';
import { Core, RewardsDistributorAdmin, MockRewardsDistributor } from '@custom-types/contracts';
import { keccak256 } from 'ethers/lib/utils';

const toBN = ethers.BigNumber.from;

describe('RewardsDistributorAdmin', function () {
  let governorAddress: string;
  let guardianAddress: string;
  let pcvControllerAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};
  let impersonatedAddresses: Array<string>;
  let core: Core;
  let rewardsDistributor: MockRewardsDistributor;
  let rewardsDistributorAdmin: RewardsDistributorAdmin;
  const AUTO_REWARDS_DISTRIBUTOR_ROLE = keccak256(utils.toUtf8Bytes('AUTO_REWARDS_DISTRIBUTOR_ROLE'));

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    impersonatedAddresses = [addresses.governorAddress, addresses.pcvControllerAddress, addresses.guardianAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ pcvControllerAddress, governorAddress, guardianAddress } = await getAddresses());

    core = (await getCore()) as Core;
    rewardsDistributor = await (await ethers.getContractFactory('MockRewardsDistributor')).deploy();
    rewardsDistributorAdmin = await (
      await ethers.getContractFactory('RewardsDistributorAdmin')
    ).deploy(core.address, rewardsDistributor.address, []);

    await rewardsDistributor.transferOwnership(rewardsDistributorAdmin.address);
  });

  describe('Init', function () {
    beforeEach(async function () {
      rewardsDistributorAdmin = await (
        await ethers.getContractFactory('RewardsDistributorAdmin')
      ).deploy(core.address, rewardsDistributor.address, impersonatedAddresses);
    });

    it('hasRole', async function () {
      for (let i = 0; i < impersonatedAddresses.length; i++) {
        /// assert that all users that were setup in constructor were given ARD role
        expect(await rewardsDistributorAdmin.hasRole(AUTO_REWARDS_DISTRIBUTOR_ROLE, impersonatedAddresses[i])).to.be
          .true;
      }
    });

    it('rewardsDistributorContract', async function () {
      expect(await rewardsDistributorAdmin.rewardsDistributorContract()).to.be.equal(rewardsDistributor.address);
    });

    it('compSupplySpeeds', async function () {
      expect(await rewardsDistributorAdmin.compSupplySpeeds(ZERO_ADDRESS)).to.be.equal(toBN('0'));
    });
  });

  describe('_setCompSupplySpeed', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).pause();
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).becomeAdmin();
        await rewardsDistributorAdmin
          .connect(impersonatedSigners[governorAddress])
          .grantRole(AUTO_REWARDS_DISTRIBUTOR_ROLE, governorAddress);

        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._setCompSupplySpeed(pcvControllerAddress, 0),
          'Pausable: paused'
        );
      });
    });
  });

  describe('_setCompBorrowSpeed', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).pause();
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).becomeAdmin();
        await rewardsDistributorAdmin
          .connect(impersonatedSigners[governorAddress])
          .grantRole(AUTO_REWARDS_DISTRIBUTOR_ROLE, governorAddress);
        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._setCompBorrowSpeed(pcvControllerAddress, 0),
          'Pausable: paused'
        );
      });
    });
  });

  describe('ACL', function () {
    describe('_setCompSupplySpeed', function () {
      it('fails when caller does not have correct role', async function () {
        const expectedError = `AccessControl: account ${governorAddress.toLowerCase()} is missing role ${AUTO_REWARDS_DISTRIBUTOR_ROLE}`;
        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._setCompSupplySpeed(pcvControllerAddress, 0),
          expectedError
        );
      });

      it('succeeds when caller has correct role', async function () {
        const newCompSupplySpeed = 1000;
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).becomeAdmin();
        await rewardsDistributorAdmin
          .connect(impersonatedSigners[governorAddress])
          .grantRole(AUTO_REWARDS_DISTRIBUTOR_ROLE, governorAddress);
        await expect(
          await rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._setCompSupplySpeed(pcvControllerAddress, newCompSupplySpeed)
        )
          .to.emit(rewardsDistributor, 'successSetCompSupplySpeed')
          .withArgs();
        expect(await rewardsDistributor.compSupplySpeed()).to.be.equal(toBN(newCompSupplySpeed));
      });
    });

    describe('_setCompBorrowSpeed', function () {
      it('fails when caller does not have correct role', async function () {
        const expectedError = `AccessControl: account ${governorAddress.toLowerCase()} is missing role ${AUTO_REWARDS_DISTRIBUTOR_ROLE}`;
        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._setCompBorrowSpeed(pcvControllerAddress, 0),
          expectedError
        );
      });

      it('succeeds when caller has correct role', async function () {
        const newCompBorrowSpeed = 1000;
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).becomeAdmin();
        await rewardsDistributorAdmin
          .connect(impersonatedSigners[governorAddress])
          .grantRole(AUTO_REWARDS_DISTRIBUTOR_ROLE, governorAddress);
        await expect(
          await rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._setCompBorrowSpeed(pcvControllerAddress, newCompBorrowSpeed)
        )
          .to.emit(rewardsDistributor, 'successSetCompBorrowSpeed')
          .withArgs();

        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompBorrowSpeed));
      });
    });

    describe('guardianDisableSupplySpeed', function () {
      it('fails when caller does not have correct role', async function () {
        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[pcvControllerAddress])
            .guardianDisableSupplySpeed(pcvControllerAddress),
          'CoreRef: Caller is not a guardian or governor'
        );
      });

      it('succeeds when caller has correct role', async function () {
        const newCompBorrowSpeed = 0;
        await expect(
          await rewardsDistributorAdmin
            .connect(impersonatedSigners[guardianAddress])
            .guardianDisableSupplySpeed(pcvControllerAddress)
        )
          .to.emit(rewardsDistributor, 'successSetCompSupplySpeed')
          .withArgs();

        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompBorrowSpeed));
      });
    });

    describe('guardianDisableBorrowSpeed', function () {
      it('fails when caller does not have correct role', async function () {
        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[pcvControllerAddress])
            .guardianDisableBorrowSpeed(pcvControllerAddress),
          'CoreRef: Caller is not a guardian or governor'
        );
      });

      it('succeeds when caller has correct role', async function () {
        const newCompBorrowSpeed = 0;
        await expect(
          await rewardsDistributorAdmin
            .connect(impersonatedSigners[guardianAddress])
            .guardianDisableBorrowSpeed(pcvControllerAddress)
        )
          .to.emit(rewardsDistributor, 'successSetCompBorrowSpeed')
          .withArgs();

        expect(await rewardsDistributor.compBorrowSpeed()).to.be.equal(toBN(newCompBorrowSpeed));
        expect(await rewardsDistributor.compBorrowSpeeds(pcvControllerAddress)).to.be.equal(toBN(newCompBorrowSpeed));
      });
    });

    describe('_addMarket', function () {
      it('fails when caller does not have correct role', async function () {
        await expectRevert(
          rewardsDistributorAdmin.connect(impersonatedSigners[pcvControllerAddress])._addMarket(pcvControllerAddress),
          'CoreRef: Caller is not a governor'
        );
      });

      it('succeeds when caller has correct role', async function () {
        await expect(
          await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress])._addMarket(pcvControllerAddress)
        )
          .to.emit(rewardsDistributor, 'successAddMarket')
          .withArgs();
        expect(await rewardsDistributor.newMarket()).to.be.equal(pcvControllerAddress);
      });
    });

    describe('_setImplementation', function () {
      it('fails when caller does not have correct role', async function () {
        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[pcvControllerAddress])
            ._setImplementation(pcvControllerAddress),
          'CoreRef: Caller is not a governor'
        );
      });

      it('succeeds when caller has correct role', async function () {
        await rewardsDistributorAdmin
          .connect(impersonatedSigners[governorAddress])
          ._setImplementation(pcvControllerAddress);
        expect(await rewardsDistributor.implementation()).to.be.equal(pcvControllerAddress);
      });
    });

    describe('_grantComp', function () {
      it('fails when caller does not have correct role', async function () {
        const compGrantAmount = 1000;
        await expectRevert(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[pcvControllerAddress])
            ._grantComp(pcvControllerAddress, compGrantAmount),
          'CoreRef: Caller is not a governor'
        );
      });

      it('succeeds when caller has correct role', async function () {
        const compGrantAmount = 1000;
        await expect(
          rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._grantComp(pcvControllerAddress, compGrantAmount)
        )
          .to.emit(rewardsDistributor, 'successGrantComp')
          .withArgs(pcvControllerAddress, compGrantAmount);
        expect(await rewardsDistributor.newCompGrantee()).to.be.equal(pcvControllerAddress);
        expect(await rewardsDistributor.newCompGranteeAmount()).to.be.equal(toBN(compGrantAmount));
      });
    });

    describe('_setPendingAdmin', function () {
      it('fails when caller is not governor', async function () {
        await expectRevert(
          rewardsDistributorAdmin._setPendingAdmin(pcvControllerAddress),
          'CoreRef: Caller is not a governor'
        );
      });

      it('succeeds when caller is governor', async function () {
        await expect(
          await rewardsDistributorAdmin
            .connect(impersonatedSigners[governorAddress])
            ._setPendingAdmin(pcvControllerAddress)
        )
          .to.emit(rewardsDistributor, 'successSetAdmin')
          .withArgs(pcvControllerAddress);
        expect(await rewardsDistributor.pendingNewAdmin()).to.be.equal(pcvControllerAddress);

        await expect(await rewardsDistributorAdmin._acceptAdmin())
          .to.emit(rewardsDistributor, 'successAcceptPendingAdmin')
          .withArgs(pcvControllerAddress);

        expect(await rewardsDistributor.pendingNewAdmin()).to.be.equal(ZERO_ADDRESS);
        expect(await rewardsDistributor.newAdmin()).to.be.equal(pcvControllerAddress);
      });
    });
  });
});
