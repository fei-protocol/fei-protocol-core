import { getCore, getAddresses, expectRevert } from '../../helpers';
import { expect } from 'chai'
import hre, { artifacts, ethers } from 'hardhat'
import { Signer } from 'ethers'
  
const StaticPCVDepositWrapper = artifacts.readArtifactSync('StaticPCVDepositWrapper');

describe('StaticPCVDepositWrapper', function () {
  let governorAddress: string

  let impersonatedSigners: { [key: string]: Signer } = { }

  before(async() => {
    const addresses = await getAddresses()

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
    ]

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [address]
      })

      impersonatedSigners[address] = await ethers.getSigner(address)
    }
  });

  beforeEach(async function () {
    ({ governorAddress } = await getAddresses());  

    this.balance = '2000';
    this.fei = '1000';
    this.core = await getCore();
    this.deposit = await StaticPCVDepositWrapper.new(
      this.core.address,
      this.balance,
      this.fei
    );
  });
  
  it('reported in USD', async function () {
    expect(await this.deposit.balanceReportedIn()).to.be.equal('0x1111111111111111111111111111111111111111');
  });

  it('returns stored values', async function() {
    expect(await this.deposit.balance()).to.be.equal(this.balance);
    expect(await this.deposit.feiReportBalance()).to.be.equal(this.fei);

    const resistantBalances = await this.deposit.resistantBalanceAndFei();
  
    expect(resistantBalances[0]).to.be.equal(this.balance);
    expect(resistantBalances[1]).to.be.equal(this.fei);
  });

  it('set balances', async function() {
    this.balance = '300';
    this.fei = '400';
    await this.deposit.setBalance('300', { from: governorAddress});
    await this.deposit.setFeiReportBalance('400', { from: governorAddress});

    expect(await this.deposit.balance()).to.be.equal(this.balance);
    expect(await this.deposit.feiReportBalance()).to.be.equal(this.fei);

    const resistantBalances = await this.deposit.resistantBalanceAndFei();
  
    expect(resistantBalances[0]).to.be.equal(this.balance);
    expect(resistantBalances[1]).to.be.equal(this.fei);
  });

  it('set balances non-governor reverts', async function () {
    await expectRevert(this.deposit.setBalance('300'), 'CoreRef: Caller is not a governor');
    await expectRevert(this.deposit.setFeiReportBalance('400'), 'CoreRef: Caller is not a governor');
  });
});
