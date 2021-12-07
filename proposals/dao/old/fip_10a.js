const { web3 } = require('hardhat');

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Make DAI bonding curve a minter
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { core, daiBondingCurve } = contracts;

  core.grantMinter(daiBondingCurve.address);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
