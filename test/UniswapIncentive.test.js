const { ZERO_ADDRESS } = require("@openzeppelin/test-helpers/src/constants");
const { accounts, contract } = require('@openzeppelin/test-environment');

const { BN, expectEvent, expectRevert } = require('@openzeppelin/test-helpers');
const { expect } = require('chai');

const Fii = contract.fromArtifact('Fii');
const MockCore = contract.fromArtifact('MockSettableCore');
const MockIncentive = contract.fromArtifact('MockIncentive');


describe('UniswapIncentive', function () {
  return;
  const [ userAddress, minterAddress, incentivizedAddress ] = accounts;

  beforeEach(async function () {
    this.core = await MockCore.new({gas: 8000000});
    this.fii = await Fii.at(await this.core.fii());
    this.incentive = await MockIncentive.new(this.core.address);
    await this.core.grantMinter(this.incentive.address);
    await this.core.grantBurner(this.incentive.address);
    await this.core.grantMinter(minterAddress);
    await this.fii.setIncentiveContract(incentivizedAddress, this.incentive.address);
    await this.fii.mint(userAddress, 100, {from: minterAddress});
  });

  it('incentivizes', async function () {
  	await this.fii.transfer(incentivizedAddress, 100, {from: userAddress});
  });
});