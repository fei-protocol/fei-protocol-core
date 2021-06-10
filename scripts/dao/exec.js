require('dotenv').config();
const { time } = require('@openzeppelin/test-helpers');

const GovernorAlpha = artifacts.require('GovernorAlpha');

// The calldata for the DAO transaction to execute. When this is not empty, the address at MAINNET_PROPOSER will submit this tx to the GovernorAlpha
const data = '';

const hre = require('hardhat');

const { web3 } = hre;

// This script fully executes an on-chain DAO proposal with pre-supplied calldata
async function main() {
  let proposer; 
  let voter; 
  let governorAddress;
  if (process.env.TESTNET_MODE) {
    console.log('Testnet mode');
    proposer = process.env.RINKEBY_PROPOSER;
    voter = process.env.RINKEBY_VOTER;
    governorAddress = process.env.RINKEBY_GOVERNOR_ALPHA;
  } else {
    console.log('Mainnet mode');
    proposer = process.env.MAINNET_PROPOSER;
    voter = process.env.MAINNET_VOTER;
    governorAddress = process.env.MAINNET_GOVERNOR_ALPHA;
  } 

  // Impersonate the proposer and voter with sufficeint TRIBE for execution
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [proposer]
  });

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [voter]
  });

  // Submit proposal to the DAO
  if (data) {
    console.log('Submitting Proposal');
    await web3.eth.sendTransaction({
      from: proposer, to: governorAddress, data, gas: 3000000
    });
  }

  const governor = await GovernorAlpha.at(governorAddress);

  const proposalNo = await governor.latestProposalIds(proposer);

  console.log(`Proposal Number: ${proposalNo}`);

  let proposal = await governor.proposals(proposalNo);
  const {startBlock} = proposal;

  // Advance to vote start
  console.log(`Advancing To: ${startBlock}`);
  await time.advanceBlockTo(startBlock);

  console.log('Casting vote');
  await governor.castVote(proposalNo, true, {from: voter});

  proposal = await governor.proposals(proposalNo);
  const {endBlock} = proposal;

  // Advance to after vote completes and queue the transaction
  console.log(`Advancing To: ${endBlock}`);
  await time.advanceBlockTo(endBlock);

  console.log('Queuing');
  await governor.queue(proposalNo);

  // Increase beyond the timelock delay
  console.log('Increasing Time');
  await time.increase(86400); // 1 day in seconds

  console.log('Executing');
  await governor.execute(proposalNo);
  console.log('Success');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
