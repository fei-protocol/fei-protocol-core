const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

// The DAO steps for creating an Aave ETH PCV deposit
async function run(addresses, oldContracts, contracts, logging = false) {
  const { aaveEthPCVDeposit, ethPCVDripper } = contracts;

  await ethPCVDripper.withdrawETH(aaveEthPCVDeposit.address, `1000${e18}`);
  await aaveEthPCVDeposit.deposit();
}

async function teardown(addresses, oldContractAddresses, logging) {}

module.exports = { setup, run, teardown };
