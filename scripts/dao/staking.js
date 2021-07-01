const { ZERO_ADDRESS } = require('@openzeppelin/test-helpers/src/constants');
const { web3 } = require('@openzeppelin/test-helpers/src/setup');
const hre = require('hardhat');

const Core = artifacts.require('Core');
const Tribe = artifacts.require('Tribe');

const MasterChief = artifacts.require('MasterChief');
const StakingTokenWrapper = artifacts.require('StakingTokenWrapper');
const CErc20Delegator = artifacts.require('CErc20Delegator');

const { getAddresses } = require('../utils/helpers');

const { timelockAddress, coreAddress, tribeAddress, rariPoolEightTribeAddress } = getAddresses();

let masterChief;
let stakingWrapper;

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
  masterChief = await MasterChief.new(coreAddress, tribeAddress);
  stakingWrapper = await StakingTokenWrapper.new(masterChief.address, 0, rariPoolEightTribeAddress); // 0 is the first pid for the first added pool

  // Impersonate the Timelock + add ETH
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [timelockAddress]
  });
  await web3.eth.sendTransaction({from: accounts[0], to: timelockAddress, value: '1000000000000000000000'});
}

// The actual steps in the proposal
async function runProposalSteps() {
  // TODO withdraw TRIBE from RewardsDistributor
  // TODO revoke Minter from RewardsDistributor
  // 1. Send TRIBE to the MasterChief
  const core = await Core.at(coreAddress);
  core.allocateTribe(masterChief.address, '100000000000000000000000000', {from: timelockAddress}); // 100m TRIBE
  console.log('sent TRIBE to MasterChief');

  // 2. add a MasterChief pool for Rari
  await masterChief.add(100, stakingWrapper.address, ZERO_ADDRESS, {from: timelockAddress});
  console.log('added fTRIBE pool to MasterChief');

  stakingWrapper.init();
  console.log('initialized staking wrapper');
}

// The actual steps in the proposal
async function test() {
  const accounts = await web3.eth.getAccounts();
  const core = await Core.at(coreAddress);
  core.allocateTribe(accounts[0], '1000000000000000000000000', {from: timelockAddress}); // 1m TRIBE
  
  // 1. Send TRIBE to the accounts[0]
  const tribe = await Tribe.at(tribeAddress);
  const fTribe = await CErc20Delegator.at(rariPoolEightTribeAddress);

  await tribe.approve(fTribe.address, '1000000000000000000000000');
  await fTribe.mint('1000000000000000000000000');

  const poolTribeBefore = await tribe.balanceOf(rariPoolEightTribeAddress);
  const userTribeBefore = await fTribe.balanceOfUnderlying(accounts[0]);
  console.log(`Before: Pool=${poolTribeBefore}, User=${userTribeBefore}`);

  await stakingWrapper.harvest();

  const poolTribeAfter = await tribe.balanceOf(rariPoolEightTribeAddress);
  const userTribeAfter = await fTribe.balanceOfUnderlying(accounts[0]);
  console.log(`After: Pool=${poolTribeAfter}, User=${userTribeAfter}`);
}

async function main() {
  await setup();
  await runProposalSteps();
  await test();
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
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
