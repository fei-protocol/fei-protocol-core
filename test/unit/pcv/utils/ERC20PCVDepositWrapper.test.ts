import { getAddresses } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';

describe('ERC20PCVDepositWrapper', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};

  let userAddress;
  let token;

  const balance = '2000';

  before(async () => {
    const addresses = await getAddresses();
    userAddress = addresses.userAddress;

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [addresses.userAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async function () {
    token = await (await ethers.getContractFactory('MockERC20')).deploy();
    await token.mint(userAddress, balance);
  });

  it('normal PCV deposit', async function () {
    const pcvDepositWrapper = await (
      await ethers.getContractFactory('ERC20PCVDepositWrapper')
    ).deploy(userAddress, token.address, false);

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(token.address);
    expect(await pcvDepositWrapper.balance()).to.be.equal(balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.equal(balance);
    expect(resistantBalances[1]).to.be.equal('0');
  });

  it('Protocol owned FEI PCV deposit', async function () {
    const pcvDepositWrapper = await (
      await ethers.getContractFactory('ERC20PCVDepositWrapper')
    ).deploy(userAddress, token.address, true);

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(token.address);
    expect(await pcvDepositWrapper.balance()).to.be.equal(balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.equal(balance);
    expect(resistantBalances[1]).to.be.equal(balance);
  });
});
