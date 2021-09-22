import { expectEvent, expectRevert, getAddresses, getCore } from '../../helpers';
import { expect } from 'chai'
import hre, { ethers, artifacts } from 'hardhat'
  
const ERC20Splitter = artifacts.readArtifactSync('ERC20Splitter');
const Tribe = artifacts.readArtifactSync('Tribe');

describe('ERC20Splitter', function () {
  let userAddress: string
  let secondUserAddress: string
  let governorAddress: string
  
  beforeEach(async function () {
    ({
      userAddress,
      secondUserAddress,
      governorAddress,
    } = await getAddresses());
    this.core = await getCore();
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
    expect(await this.tribe.balanceOf(this.erc20Splitter.address)).to.be.equal('100000');

    expectEvent(await this.erc20Splitter.allocate({from: userAddress}), 'Allocate', {
      caller: userAddress,
      amount: '100000'
    });

    expect(await this.tribe.balanceOf(this.erc20Splitter.address)).to.be.equal('0');
    expect(await this.tribe.balanceOf(userAddress)).to.be.equal('90000');
    expect(await this.tribe.balanceOf(secondUserAddress)).to.be.equal('10000');
  });
  
  it('Paused reverts', async function() {
    await this.erc20Splitter.pause({from: governorAddress});
    await expectRevert(this.erc20Splitter.allocate(), 'Pausable: paused');
  });
});
