import { expectRevert, balance, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai';
import hre, { ethers, artifacts } from 'hardhat';
import { Signer } from 'ethers';
import testHelpers, { BN, ether } from '@openzeppelin/test-helpers';

const toBN = ethers.BigNumber.from;
const {
    constants: { ZERO_ADDRESS }
} = testHelpers;

const MockRewardsDistributor = artifacts.readArtifactSync('MockRewardsDistributor');
const RewardsDistributorAdmin = artifacts.readArtifactSync('RewardsDistributorAdmin');

describe('AutoRewardsDistributor', function () {
  let governorAddress: string;
  let pcvControllerAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

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

    this.core = await getCore();
    this.rewardsDistributor = await (await ethers.getContractFactory('MockRewardsDistributor')).deploy();
    this.rewardsDistributorAdmin = await (await ethers.getContractFactory('RewardsDistributorAdmin'))
        .deploy(this.core.address, this.rewardsDistributor.address);

    await this.rewardsDistributor.transferOwnership(this.rewardsDistributorAdmin.address);
  });

  describe('Init', function () {
    it('rewardsDistributorContract', async function () {
      expect(await this.rewardsDistributorAdmin.rewardsDistributorContract()).to.be.equal(this.rewardsDistributor.address);
    });

    it('compSupplySpeeds', async function () {
      expect(await this.rewardsDistributorAdmin.compSupplySpeeds(ZERO_ADDRESS)).to.be.equal(toBN('0'));
    });
  });

  describe('_setCompSupplySpeed', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).pause();
        await expectRevert(
            this.rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress])._setCompSupplySpeed(pcvControllerAddress, 0),
            'Pausable: paused'
        );
      });
    });
  });

  describe('_setCompBorrowSpeed', function () {
    describe('Paused', function () {
      it('reverts', async function () {
        await this.rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress]).pause();
        await expectRevert(
            this.rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress])._setCompBorrowSpeed(pcvControllerAddress, 0),
            'Pausable: paused'
        );
      });
    });
  });

  describe('ACL', function () {
    describe('_setPendingAdmin', function () {
      it('fails when caller is not governor', async function () {
        await expectRevert(
          this.rewardsDistributorAdmin._setPendingAdmin(pcvControllerAddress),
          "CoreRef: Caller is not a governor"
        );
      });
        
      it('succeeds when caller is governor', async function () {
        await expect(
            await this.rewardsDistributorAdmin.connect(impersonatedSigners[governorAddress])._setPendingAdmin(pcvControllerAddress)
        ).to.emit(this.rewardsDistributor, 'successSetAdmin').withArgs(pcvControllerAddress);
        expect(await this.rewardsDistributor.pendingNewAdmin()).to.be.equal(pcvControllerAddress);

        await expect(
            await this.rewardsDistributorAdmin._acceptAdmin()
        ).to.emit(this.rewardsDistributor, 'successAcceptPendingAdmin').withArgs(pcvControllerAddress);

        expect(await this.rewardsDistributor.pendingNewAdmin()).to.be.equal(ZERO_ADDRESS);
        expect(await this.rewardsDistributor.newAdmin()).to.be.equal(pcvControllerAddress);
      });
    });
  });
});
