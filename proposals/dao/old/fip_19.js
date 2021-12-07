import { expect } from 'hardhat';
import { BN } from '../../test/helpers';

const e18 = '000000000000000000';
const tenMillions = `10000000${e18}`;

async function setup(addresses, oldContracts, contracts, logging) {}

/*
   Make RAI bonding curve a minter and set its mint cap to 10m FEI 
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { core, raiBondingCurve } = contracts;

  await core.grantMinter(raiBondingCurve.address);
  await raiBondingCurve.setMintCap(tenMillions);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {
  const { core, raiBondingCurve } = contracts;

  expect(await core.isMinter(raiBondingCurve.address)).to.be.true;
  expect(await raiBondingCurve.mintCap()).to.be.bignumber.equal(new BN(tenMillions));
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
