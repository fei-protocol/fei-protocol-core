const {
  expectEvent,
  expectRevert,
  expect,
  getAddresses,
  getCore,
} = require('../../helpers');
  
const ERC20Splitter = artifacts.require('ERC20Splitter');
const Tribe = artifacts.require('Tribe');

describe('ERC20Splitter', function () {
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
    this.erc20Splitter = await ERC20Splitter.new(
      this.core.address, 
      this.tribe.address, 
      [userAddress, secondUserAddress], 
      [9000, 1000]
    );

    await this.core.allocateTribe(this.erc20Splitter.address, '100000', {from: governorAddress});
  });

  it('Unpaused allocates TRIBE successfully', async function() {
    expect(await this.tribe.balanceOf(this.erc20Splitter.address)).to.be.bignumber.equal('100000');

    expectEvent(await this.erc20Splitter.allocate({from: userAddress}), 'Allocate', {
      caller: userAddress,
      amount: '100000'
    });

    expect(await this.tribe.balanceOf(this.erc20Splitter.address)).to.be.bignumber.equal('0');
    expect(await this.tribe.balanceOf(userAddress)).to.be.bignumber.equal('90000');
    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.bignumber.equal('10000');
  });
  
  it('Paused reverts', async function() {
    await this.erc20Splitter.pause({from: governorAddress});
    await expectRevert(this.erc20Splitter.allocate(), 'Pausable: paused');
  });
});
