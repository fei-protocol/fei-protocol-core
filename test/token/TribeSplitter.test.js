const {
  expectEvent,
  expectRevert,
  expect,
  getAddresses,
  getCore,
} = require('../helpers');
  
const TribeSplitter = artifacts.require('TribeSplitter');
const Tribe = artifacts.require('Tribe');

describe('TribeSplitter', function () {
  let userAddress;
  let secondUserAddress;
  let governorAddress;
  
  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      governorAddress,
    } = await getAddresses());
    this.core = await getCore(true);
    this.tribe = await Tribe.at(await this.core.tribe());
    this.tribeSplitter = await TribeSplitter.new(this.core.address, [userAddress, secondUserAddress], [9000, 1000]);

    await this.core.allocateTribe(this.tribeSplitter.address, '100000', {from: governorAddress});
  });

  it('Unpaused allocates TRIBE successfully', async function() {
    expect(await this.tribe.balanceOf(this.tribeSplitter.address)).to.be.bignumber.equal('100000');

    expectEvent(await this.tribeSplitter.allocate({from: userAddress}), 'Allocate', {
      caller: userAddress,
      amount: '100000'
    });

    expect(await this.tribe.balanceOf(this.tribeSplitter.address)).to.be.bignumber.equal('0');
    expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal('90000');
    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal('10000');
  });
  
  it('Paused reverts', async function() {
    await this.tribeSplitter.pause({from: governorAddress});
    await expectRevert(this.tribeSplitter.allocate(), 'Pausable: paused');
  });
});
