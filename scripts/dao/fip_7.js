const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');

const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');

const { getAddresses } = require('../utils/helpers');

const { timelockAddress, rariPoolEightAddress } = getAddresses();
/*
 DAO Proposal Steps
    1. Accept admin transfer from Tetranode
    2. Mint 10M FEI into Timelock
    3. Approve 10M FEI transfer
    4. Mint cTokens by depositing FEI into Rari pool
*/

// The steps that don't form part of the proposal but need to be mocked up
async function setup() {
  const accounts = await web3.eth.getAccounts();
  const rariPoolEight = await CErc20Delegator.at(rariPoolEightAddress);

  // Impersonate the current admin address + add ETH
  const currentPoolAdmin = await rariPoolEight.admin();
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [currentPoolAdmin]
  });
  await web3.eth.sendTransaction({from: accounts[0], to: currentPoolAdmin, value: '10000000000000000'});

  // Initiate transfer admin over to our timelock
  await rariPoolEight._setPendingAdmin(timelockAddress, {
    from: currentPoolAdmin
  });

  // Impersonate the Timelock + add ETH
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });
  await web3.eth.sendTransaction({from: accounts[0], to: timelockAddress, value: '10000000000000000'});
}

// The actual steps in the proposal
async function runProposalSteps() {
  const rariPoolEight = await CErc20Delegator.at(rariPoolEightAddress);
  const fei = await Fei.at(process.env.MAINNET_FEI);    

  // 1. Accept admin role from our timelock
  await rariPoolEight._acceptAdmin({
    from: timelockAddress,
  });

  // 2. Mint FEI into timelock
  const tenMillion = '10000000000000000000000000';
  await fei.mint(timelockAddress, tenMillion, {
    from: timelockAddress,
  });

  // 3. Approve transfer into rari pool
  await fei.approve(rariPoolEight.address, tenMillion, {
    from: timelockAddress,
  });

  // 4. Supply FEI to rari pool
  await rariPoolEight.mint(tenMillion, {
    from: timelockAddress,
  });
}

async function main() {
  await setup();
  await runProposalSteps();
}

module.exports = { main };

// Run setup
// setup()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });

// Run full script
// main()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
