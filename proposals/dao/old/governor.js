const { web3 } = require('hardhat');

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

/*
 1. Grant timelock Governor, Minter, PCVController
*/
async function run(addresses, oldContracts, contracts, logging = false) {
  const { core, fei, timelock } = contracts;
  core.grantMinter(timelock.address);
  core.grantPCVController(timelock.address);
  core.grantGovernor(timelock.address);
}

async function teardown(addresses, oldContracts, contracts, logging) {}

module.exports = {
  setup,
  run,
  teardown
};
