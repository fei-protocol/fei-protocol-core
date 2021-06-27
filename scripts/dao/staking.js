const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');

const CErc20Delegator = artifacts.require('CErc20Delegator');
const Fei = artifacts.require('Fei');

const { getAddresses } = require('../utils/helpers');

const { timelockAddress } = getAddresses();
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
  // TODO Deploy the MasterChief and TribalCouncil

  // Impersonate the Timelock + add ETH
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });
  await web3.eth.sendTransaction({from: accounts[0], to: timelockAddress, value: '10000000000000000'});
}

// The actual steps in the proposal
async function runProposalSteps() {
  // TODO 1. Send TRIBE to the MasterChief

  // TODO 2. add a MasterChief pool for Rari
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
