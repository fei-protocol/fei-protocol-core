const {
  expect,
  getCore,
  getAddresses,
  expectRevert,
} = require('../helpers');
  
const StaticPCVDepositWrapper = artifacts.require('StaticPCVDepositWrapper');

describe('StaticPCVDepositWrapper', function () {
  let governorAddress;
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
    expect(await this.deposit.balance()).to.be.bignumber.equal(this.balance);
    expect(await this.deposit.feiReportBalance()).to.be.bignumber.equal(this.fei);

    const resistantBalances = await this.deposit.resistantBalanceAndFei();
  
    expect(resistantBalances[0]).to.be.bignumber.equal(this.balance);
    expect(resistantBalances[1]).to.be.bignumber.equal(this.fei);
  });

  it('set balances', async function() {
    this.balance = '300';
    this.fei = '400';
    await this.deposit.setBalance('300', { from: governorAddress});
    await this.deposit.setFeiReportBalance('400', { from: governorAddress});

    expect(await this.deposit.balance()).to.be.bignumber.equal(this.balance);
    expect(await this.deposit.feiReportBalance()).to.be.bignumber.equal(this.fei);

    const resistantBalances = await this.deposit.resistantBalanceAndFei();
  
    expect(resistantBalances[0]).to.be.bignumber.equal(this.balance);
    expect(resistantBalances[1]).to.be.bignumber.equal(this.fei);
  });

  it('set balances non-governor reverts', async function () {
    await expectRevert(this.deposit.setBalance('300'), 'CoreRef: Caller is not a governor');
    await expectRevert(this.deposit.setFeiReportBalance('400'), 'CoreRef: Caller is not a governor');
  });
});
