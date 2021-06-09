const { time } = require('@openzeppelin/test-helpers');
require('@openzeppelin/test-helpers/configure')({
  provider: 'http://localhost:7545',
});

const GovernorAlpha = artifacts.require('GovernorAlpha');

// The calldata for the DAO transaction to execute. When this is not empty, the address at MAINNET_PROPOSER will submit this tx to the GovernorAlpha
const data = '';

module.exports = async function(callback) {
  require('dotenv').config();

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

  console.log(`Advancing To: ${startBlock}`);
  await time.advanceBlockTo(startBlock);

  console.log('Casting vote');
  await governor.castVote(proposalNo, true, {from: voter});

  proposal = await governor.proposals(proposalNo);
  const {endBlock} = proposal;

  console.log(`Advancing To: ${endBlock}`);
  await time.advanceBlockTo(endBlock);

  console.log('Queuing');
  await governor.queue(proposalNo);

  console.log('Increasing Time');
  await time.increase(140000);

  console.log('Executing');
  await governor.execute(proposalNo);
  console.log('Success');

  callback();
};
