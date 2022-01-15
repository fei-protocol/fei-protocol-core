import { getCore, getAddresses } from '@test/helpers';
import { expect } from 'chai';
import hre, { ethers } from 'hardhat';
import { Signer } from 'ethers';
import { Core, MockERC20, MockPCVDepositV2 } from '@custom-types/contracts';

describe('PCVDepositWrapper', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};
  const balance = ethers.utils.parseEther('2000');
  let core: Core;
  let token: MockERC20;
  let deposit: MockPCVDepositV2;

  before(async () => {
    const addresses = await getAddresses();

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [
      addresses.userAddress,
      addresses.pcvControllerAddress,
      addresses.governorAddress,
      addresses.pcvControllerAddress,
      addresses.minterAddress,
      addresses.burnerAddress,
      addresses.beneficiaryAddress1,
      addresses.beneficiaryAddress2
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
    core = await getCore();
    token = await (await ethers.getContractFactory('MockERC20')).deploy();
    await token.deployTransaction.wait();
    deposit = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(
      core.address,
      token.address,
      balance,
      '0' // ignoted protocol FEI
    );
  });

  it('normal PCV deposit', async function () {
    const pcvDepositWrapper = await (
      await ethers.getContractFactory('PCVDepositWrapper')
    ).deploy(deposit.address, token.address, false);

    await token.mint(deposit.address, ethers.utils.parseEther('2000'));
    await deposit.deposit();

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(token.address);
    expect(await pcvDepositWrapper.balance()).to.be.equal(balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.equal(balance);
    expect(resistantBalances[1]).to.be.equal('0');
  });

  it('Protocol owned FEI PCV deposit', async function () {
    const pcvDepositWrapper = await (
      await ethers.getContractFactory('PCVDepositWrapper')
    ).deploy(deposit.address, token.address, true);

    await token.mint(deposit.address, ethers.utils.parseEther('2000'));
    await deposit.deposit();

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(token.address);
    expect(await pcvDepositWrapper.balance()).to.be.equal(balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.equal(balance);
    expect(resistantBalances[1]).to.be.equal(balance);
  });
});
