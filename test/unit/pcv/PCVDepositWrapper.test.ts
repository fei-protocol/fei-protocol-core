import { getCore, getAddresses } from '../../helpers';
import { expect } from 'chai';
import hre, { artifacts, ethers } from 'hardhat';
import { Signer } from 'ethers';

const PCVDepositWrapper = artifacts.readArtifactSync('PCVDepositWrapper');
const MockPCVDepositV2 = artifacts.readArtifactSync('MockPCVDepositV2');
const MockERC20 = artifacts.readArtifactSync('MockERC20');

const toBN = ethers.BigNumber.from;

describe('PCVDepositWrapper', function () {
  const impersonatedSigners: { [key: string]: Signer } = {};

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
    this.balance = '2000';
    this.core = await getCore();
    this.token = await (await ethers.getContractFactory('MockERC20')).deploy();
    this.deposit = await (
      await ethers.getContractFactory('MockPCVDepositV2')
    ).deploy(
      this.core.address,
      this.token.address,
      this.balance,
      '0' // ignoted protocol FEI
    );
  });

  it('normal PCV deposit', async function () {
    const pcvDepositWrapper = await (
      await ethers.getContractFactory('PCVDepositWrapper')
    ).deploy(this.deposit.address, this.token.address, false);

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(this.token.address);
    expect(await pcvDepositWrapper.balance()).to.be.equal(this.balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.equal(this.balance);
    expect(resistantBalances[1]).to.be.equal('0');
  });

  it('Protocol owned FEI PCV deposit', async function () {
    const pcvDepositWrapper = await (
      await ethers.getContractFactory('PCVDepositWrapper')
    ).deploy(this.deposit.address, this.token.address, true);

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(this.token.address);
    expect(await pcvDepositWrapper.balance()).to.be.equal(this.balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.equal(this.balance);
    expect(resistantBalances[1]).to.be.equal(this.balance);
  });
});
