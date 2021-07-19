const IERC20 = artifacts.require('IERC20');

const e18 = '000000000000000000';

async function setup(addresses, oldContracts, contracts, logging) {}

// The DAO steps for updating the existing FEI deployment to Fuse and adding an example ETH deposit
// Note: this is an example DAO flow and not tied to an existing FIP
async function run(addresses, oldContracts, contracts, logging = false) {
  const {
    rariPool8FeiAddress,
    timelockAddress
  } = addresses;

  const {
    rariPool8FeiPCVDeposit,
    rariPool8EthPCVDeposit,
    ethPCVDripper
  } = contracts;
  const rariPool8Fei = await IERC20.at(rariPool8FeiAddress);
  const balanceOfRariFei = await rariPool8Fei.balanceOf(timelockAddress);

  // The timelock currently owns some fFEI, so we should transfer this balance to the PCV deposit
  await rariPool8Fei.transfer(rariPool8FeiPCVDeposit.address, balanceOfRariFei, {from: timelockAddress});

  // Withdraw 1000 ETH to send to fETH pool
  await ethPCVDripper.withdrawETH(rariPool8EthPCVDeposit.address, `1000${e18}`);
  
  await rariPool8EthPCVDeposit.deposit();
}

async function teardown(addresses, oldContractAddresses, logging) {}

module.exports = { setup, run, teardown };
