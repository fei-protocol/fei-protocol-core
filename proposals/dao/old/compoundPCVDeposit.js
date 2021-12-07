const IERC20 = artifacts.require('IERC20');

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

// The DAO steps for FIP-9, these must be done with Governor access control privileges
async function run(addresses, oldContracts, contracts, logging = false) {
  const { rariPool8FeiAddress, timelockAddress } = addresses;

  const { rariPool8FeiPCVDeposit, compoundEthPCVDeposit, ethPCVDripper } = contracts;
  const rariPool8Fei = await IERC20.at(rariPool8FeiAddress);
  const balanceOfRariFei = await rariPool8Fei.balanceOf(timelockAddress);

  await rariPool8Fei.transfer(rariPool8FeiPCVDeposit.address, balanceOfRariFei, { from: timelockAddress });

  await ethPCVDripper.withdrawETH(compoundEthPCVDeposit.address, `1000${e18}`);

  await compoundEthPCVDeposit.deposit();
}

async function teardown(addresses, oldContractAddresses, logging) {}

module.exports = { setup, run, teardown };
