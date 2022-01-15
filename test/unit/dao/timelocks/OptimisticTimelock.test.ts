import { expectRevert, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

const toBN = ethers.BigNumber.from;

const impersonatedSigners: { [key: string]: Signer } = {};

describe('TimelockedDelegator', function () {
  let userAddress;
  let governorAddress;

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.secondUserAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress
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
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    governorAddress = addresses.governorAddress;

    this.core = await getCore();

    this.delay = toBN(1000);
    this.timelock = await (
      await ethers.getContractFactory('OptimisticTimelock')
    ).deploy(this.core.address, this.delay, [], []);
  });

  describe('Become Admin', async function () {
    it('user reverts', async function () {
      await expectRevert(
        this.timelock.connect(impersonatedSigners[userAddress]).becomeAdmin(),
        'CoreRef: Caller is not a guardian or governor'
      );
    });

    it('governor succeeds', async function () {
      const adminRole = await this.timelock.TIMELOCK_ADMIN_ROLE();
      await this.timelock.connect(impersonatedSigners[governorAddress]).becomeAdmin();
      expect(await this.timelock.hasRole(adminRole, governorAddress)).to.be.true;
    });
  });
});
