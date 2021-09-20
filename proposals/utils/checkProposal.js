import { getMainnetContracts, getContractAddresses } from '../../end-to-end/setup/loadContracts.ts';

const hre = require('hardhat');
const { time } = require('@openzeppelin/test-helpers');

// Multisig
const voterAddress = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775';

require('dotenv').config();

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */ 
async function checkProposal() {
  const proposalName = process.env.DEPLOY_FILE;

  if (!proposalName) {
    throw new Error('DEPLOY_FILE env variable not set');
  }

  const contracts = await getMainnetContracts();
  const { governorAlpha } = contracts;

  const proposalNo = process.env.PROPOSAL_NUMBER ? process.env.PROPOSAL_NUMBER : await governorAlpha.proposalCount();

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [voterAddress]
  });

  console.log(`Proposal Number: ${proposalNo}`);

  let proposal = await governorAlpha.proposals(proposalNo);
  const {startBlock} = proposal;

  // Advance to vote start
  if (await time.latestBlock() < startBlock) {
    console.log(`Advancing To: ${startBlock}`);
    await time.advanceBlockTo(startBlock);
  } else {
    console.log('Vote already began');
  }

  try {
    await governorAlpha.castVote(proposalNo, true, {from: voterAddress});
    console.log('Casted vote');
  } catch {
    console.log('Already voted');
  }

  proposal = await governorAlpha.proposals(proposalNo);
  const {endBlock} = proposal;

  // Advance to after vote completes and queue the transaction
  if (await time.latestBlock() < endBlock) {
    console.log(`Advancing To: ${endBlock}`);
    await time.advanceBlockTo(endBlock);

    console.log('Queuing');
    await governorAlpha.queue(proposalNo);
  } else {
    console.log('Already queued');
  }

  // Increase beyond the timelock delay
  console.log('Increasing Time');
  await time.increase(86400); // 1 day in seconds

  console.log('Executing');
  await governorAlpha.execute(proposalNo);
  console.log('Success');
      
  // Get the upgrade setup, run and teardown scripts
  const { teardown, validate } = await import(`../dao/${proposalName}`);

  const contractAddresses = await getContractAddresses(contracts);
  
  console.log('Teardown');
  await teardown(contractAddresses, contracts, contracts);
  
  console.log('Validate');
  await validate(contractAddresses, contracts, contracts);
}

checkProposal()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
