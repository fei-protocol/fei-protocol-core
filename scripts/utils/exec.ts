import hre, { ethers, artifacts } from 'hardhat';
import { time } from '@openzeppelin/test-helpers';

import * as dotenv from 'dotenv';

dotenv.config();

// This script fully executes an on-chain DAO proposal with pre-supplied calldata

// txData = The calldata for the DAO transaction to execute.
// The address at MAINNET_PROPOSER will submit this tx to the GovernorAlpha
async function exec(txData, totalValue, addresses) {
  const { proposerAddress, voterAddress, governorAlphaAddress } = addresses;

  // Impersonate the proposer and voter with sufficient TRIBE for execution
  await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: [proposerAddress] });
  await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: [voterAddress] });

  // Submit proposal to the DAO
  if (txData) {
    console.log('Submitting Proposal');
    await (
      await ethers.getSigner(proposerAddress)
    ).sendTransaction({
      to: governorAlphaAddress,
      data: txData,
      gasLimit: 6000000
    });
  }

  const governor = await ethers.getContractAt('GovernorAlpha', governorAlphaAddress);

  const proposalNo = await governor.latestProposalIds(proposerAddress);

  console.log(`Proposal Number: ${proposalNo}`);

  let proposal = await governor.proposals(proposalNo);
  const { startBlock } = proposal;

  // Advance to vote start
  if ((await time.latestBlock()) < startBlock) {
    console.log(`Advancing To: ${startBlock}`);
    await time.advanceBlockTo(startBlock);
  } else {
    console.log('Vote already began');
  }

  try {
    await governor.castVote(proposalNo, true, { from: voterAddress });
    console.log('Casted vote');
  } catch {
    console.log('Already voted');
  }

  proposal = await governor.proposals(proposalNo);
  const { endBlock } = proposal;

  // Advance to after vote completes and queue the transaction
  if ((await time.latestBlock()) < endBlock) {
    console.log(`Advancing To: ${endBlock}`);
    await time.advanceBlockTo(endBlock);

    console.log('Queuing');
    await governor.queue(proposalNo);
  } else {
    console.log('Already queued');
  }

  // Increase beyond the timelock delay
  console.log('Increasing Time');
  await time.increase(86400); // 1 day in seconds

  console.log('Executing');
  await governor.execute(proposalNo, { value: totalValue });
  console.log('Success');
}

module.exports = { exec };
