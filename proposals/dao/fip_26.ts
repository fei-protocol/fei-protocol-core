import { expect } from "chai";

const e18 = '000000000000000000';

const FEI_PER_USD = '9950';
const BUFFER = '50';
const DAI_CAP = `150000000${e18}`;
const DAI_SCALE = `100000000${e18}`;
const DAI_DISCOUNT = '0';
const DPI_CAP = `50000000${e18}`;
const RAI_CAP = `20000000${e18}`;

async function setup(addresses, oldContracts, contracts, logging) {}

async function run(addresses, oldContracts, contracts, logging = false) {}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {
  const {
    ethReserveStabilizer,
    bondingCurve,
    daiBondingCurve,
    dpiBondingCurve,
    raiBondingCurve
  } = contracts;

  expect(await bondingCurve.buffer()).to.be.bignumber.equal(BUFFER);
  expect(await ethReserveStabilizer.usdPerFeiBasisPoints()).to.be.bignumber.equal(FEI_PER_USD);
  expect(await daiBondingCurve.mintCap()).to.be.bignumber.equal(DAI_CAP);
  expect(await daiBondingCurve.scale()).to.be.bignumber.equal(DAI_SCALE);
  expect(await daiBondingCurve.discount()).to.be.bignumber.equal(DAI_DISCOUNT);
  expect(await dpiBondingCurve.mintCap()).to.be.bignumber.equal(DPI_CAP);
  expect(await raiBondingCurve.mintCap()).to.be.bignumber.equal(RAI_CAP);
}

module.exports = {
  setup, run, teardown, validate
};
