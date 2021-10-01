import { expectRevert, balance, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers, artifacts } from 'hardhat';
import { Signer, utils } from 'ethers';
import testHelpers, { BN, ether } from '@openzeppelin/test-helpers';
import { Core } from '../../../types/contracts/Core'
import { RewardsDistributorAdmin } from '../../../types/contracts/RewardsDistributorAdmin'
import { MockRewardsDistributor } from '../../../types/contracts/MockRewardsDistributor'
import { keccak256 } from 'ethers/lib/utils';

const toBN = ethers.BigNumber.from;
const {
    constants: { ZERO_ADDRESS }
} = testHelpers;

describe('RewardsDistributorAdmin', function () {
  let governorAddress: string;
  let pcvControllerAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};
  let core: Core;
  let rewardsDistributor: MockRewardsDistributor;
  let rewardsDistributorAdmin: RewardsDistributorAdmin;
  let AUTO_REWARDS_DISTRIBUTOR = utils.keccak256(utils.toUtf8Bytes("AUTO_REWARDS_DISTRIBUTOR"));
  let ADMIN_ROLE = '0x0000000000000000000000000000000000000000000000000000000000000000';

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.governorAddress,
      addresses.pcvControllerAddress,
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
    ({ pcvControllerAddress, governorAddress } = await getAddresses());

    core = await getCore() as Core;
    rewardsDistributor = await (await ethers.getContractFactory('MockRewardsDistributor')).deploy();
    rewardsDistributorAdmin = await (await ethers.getContractFactory('RewardsDistributorAdmin'))
        .deploy(core.address, rewardsDistributor.address, []);

    await rewardsDistributor.transferOwnership(rewardsDistributorAdmin.address);
  });

  describe('Init', function () {
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
        /// become admin
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).becomeAdmin();
        /// now give yourself the AUTO_REWARDS_DISTRIBUTOR role so that we can hit the _setCompSupplySpeed
        /// function without running into access errors
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).grantRole(AUTO_REWARDS_DISTRIBUTOR, governorAddress);

        await expectRevert(
            rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress])._setCompSupplySpeed(pcvControllerAddress, 0),
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
        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).grantRole(AUTO_REWARDS_DISTRIBUTOR, governorAddress);        await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).grantRole(AUTO_REWARDS_DISTRIBUTOR, governorAddress);
        await expectRevert(
            rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress])._setCompBorrowSpeed(pcvControllerAddress, 0),
            'Pausable: paused'
        );
      });
    });
  });

  describe('ACL', function () {
    describe('_setPendingAdmin', function () {
      it('fails when caller is not governor', async function () {
        await expectRevert(
          rewardsDistributorAdmin._setPendingAdmin(pcvControllerAddress),
          "CoreRef: Caller is not a governor"
        );
      });
        
      it('succeeds when caller is governor', async function () {
        await expect(
            await rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress])._setPendingAdmin(pcvControllerAddress)
        ).to.emit(rewardsDistributor, 'successSetAdmin').withArgs(pcvControllerAddress);
        expect(await rewardsDistributor.pendingNewAdmin()).to.be.equal(pcvControllerAddress);

        await expect(
            await rewardsDistributorAdmin._acceptAdmin()
        ).to.emit(rewardsDistributor, 'successAcceptPendingAdmin').withArgs(pcvControllerAddress);

        expect(await rewardsDistributor.pendingNewAdmin()).to.be.equal(ZERO_ADDRESS);
        expect(await rewardsDistributor.newAdmin()).to.be.equal(pcvControllerAddress);
      });
    });
  });
});
