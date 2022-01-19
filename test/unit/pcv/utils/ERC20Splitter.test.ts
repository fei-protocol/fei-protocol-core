import { expectRevert, getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

describe('ERC20Splitter', function () {
  let userAddress: string;
  let secondUserAddress: string;
  let governorAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress, addresses.pcvControllerAddress, addresses.governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    ({ userAddress, secondUserAddress, governorAddress } = await getAddresses());
    this.core = await getCore();
    this.tribe = await ethers.getContractAt('Tribe', await this.core.tribe());
    this.erc20Splitter = await (
      await ethers.getContractFactory('ERC20Splitter')
    ).deploy(this.core.address, this.tribe.address, [userAddress, secondUserAddress], [9000, 1000]);

    await this.core.connect(impersonatedSigners[governorAddress]).allocateTribe(this.erc20Splitter.address, '100000');
  });

  it('Unpaused allocates TRIBE successfully', async function () {
    expect(await this.tribe.balanceOf(this.erc20Splitter.address)).to.be.equal('100000');

    /*await expect(*/ await this.erc20Splitter.connect(impersonatedSigners[userAddress]).allocate(); /*, 'Allocate', {
      caller: userAddress,
      amount: '100000'
    }); */

    expect(await this.tribe.balanceOf(this.erc20Splitter.address)).to.be.equal('0');
    expect(await this.tribe.balanceOf(userAddress)).to.be.equal('90000');
    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.equal('10000');
  });

  it('Paused reverts', async function () {
    await this.erc20Splitter.connect(impersonatedSigners[governorAddress]).pause();
    await expectRevert(this.erc20Splitter.allocate(), 'Pausable: paused');
  });
});
