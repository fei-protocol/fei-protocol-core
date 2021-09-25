import { expect } from 'chai';
import { ethers } from 'hardhat';

const e18 = ethers.constants.WeiPerEther;

const FEI_PER_USD = '9950';
const BUFFER = '50';
const DAI_CAP = e18.mul(150_000_000).toString();
const DAI_SCALE = e18.mul(100_000_000).toString();
const DAI_DISCOUNT = '0';
const DPI_CAP = e18.mul(50_000_000).toString();
const RAI_CAP = e18.mul(20_000_000).toString();

async function setup(addresses, oldContracts, contracts, logging) {
  console.log('No actions to complete in setup.');
}

async function run(addresses, oldContracts, contracts, logging = false) {
  console.log('No actions to complete in run.');
}

async function teardown(addresses, oldContracts, contracts, logging) {
  console.log('No actions to complete in teardown.');
}

async function validate(addresses, oldContracts, contracts) {
  const { ethReserveStabilizer, bondingCurve, daiBondingCurve, dpiBondingCurve, raiBondingCurve } = contracts;

  expect(await bondingCurve.buffer()).to.be.bignumber.equal(BUFFER);
  expect(await ethReserveStabilizer.usdPerFeiBasisPoints()).to.be.bignumber.equal(FEI_PER_USD);
  expect(await daiBondingCurve.mintCap()).to.be.bignumber.equal(DAI_CAP);
  expect(await daiBondingCurve.scale()).to.be.bignumber.equal(DAI_SCALE);
  expect(await daiBondingCurve.discount()).to.be.bignumber.equal(DAI_DISCOUNT);
  expect(await dpiBondingCurve.mintCap()).to.be.bignumber.equal(DPI_CAP);
  expect(await raiBondingCurve.mintCap()).to.be.bignumber.equal(RAI_CAP);
}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
