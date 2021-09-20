const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

async function run(addresses, oldContracts, contracts, logging) {
  contracts.core.allocateTribe(addresses.communalFarmAddress, `2000000${e18}`); // 2M TRIBE
}

async function teardown(addresses, oldContracts, contracts, logging) {}

module.exports = { setup, run, teardown };
