const { web3 } = require('hardhat');

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Make DPI bonding curve a minter
 2. Make DPI Uniswap PCV deposit a minter
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { core, dpiUniswapPCVDeposit, dpiBondingCurve } = contracts;

  core.grantMinter(dpiBondingCurve.address);
  core.grantMinter(dpiUniswapPCVDeposit.address);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

async function validate(addresses, oldContracts, contracts) {}

module.exports = {
  setup,
  run,
  teardown,
  validate
};
