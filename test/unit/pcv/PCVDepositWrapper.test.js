const {
  expect,
  getCore,
} = require('../../helpers');

const PCVDepositWrapper = artifacts.require('PCVDepositWrapper');
const MockPCVDepositV2 = artifacts.require('MockPCVDepositV2');
const MockERC20 = artifacts.require('MockERC20');

describe('PCVDepositWrapper', function () {
  beforeEach(async function () {
    this.balance = '2000';
    this.core = await getCore();
    this.token = await MockERC20.new();
    this.deposit = await MockPCVDepositV2.new(
      this.core.address,
      this.token.address,
      this.balance,
      '0' // ignoted protocol FEI
    );
  });

  it('normal PCV deposit', async function() {
    const pcvDepositWrapper = await PCVDepositWrapper.new(
      this.deposit.address,
      this.token.address,
      false
    );

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(this.token.address);
    expect(await pcvDepositWrapper.balance()).to.be.bignumber.equal(this.balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.bignumber.equal(this.balance);
    expect(resistantBalances[1]).to.be.bignumber.equal('0');
  });

  it('Protocol owned FEI PCV deposit', async function() {
    const pcvDepositWrapper = await PCVDepositWrapper.new(
      this.deposit.address,
      this.token.address,
      true
    );

    expect(await pcvDepositWrapper.balanceReportedIn()).to.be.equal(this.token.address);
    expect(await pcvDepositWrapper.balance()).to.be.bignumber.equal(this.balance);
    const resistantBalances = await pcvDepositWrapper.resistantBalanceAndFei();

    expect(resistantBalances[0]).to.be.bignumber.equal(this.balance);
    expect(resistantBalances[1]).to.be.bignumber.equal(this.balance);
  });
});
