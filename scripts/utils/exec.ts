import hre, { ethers } from 'hardhat';
import { time, getImpersonatedSigner } from '@test/helpers';

import * as dotenv from 'dotenv';

dotenv.config();

const toBN = ethers.BigNumber.from;

// This script fully executes an on-chain DAO proposal with pre-supplied calldata

// txData = The calldata for the DAO transaction to execute.
// The address at MAINNET_PROPOSER will submit this tx to the GovernorAlpha
export async function exec(txData, totalValue, addresses, proposalNo) {
  const { proposerAddress, voterAddress, governorAlphaAddress } = addresses;

  // Impersonate the proposer and voter with sufficient TRIBE for execution
  await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: [proposerAddress] });

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

  execProposal(voterAddress, governorAlphaAddress, totalValue, proposalNo);
}

export async function execProposal(voterAddress, governorAlphaAddress, totalValue, proposalNo) {
  const governor = await ethers.getContractAt('FeiDAO', governorAlphaAddress);
  const signer = await getImpersonatedSigner(voterAddress);

  console.log(`Proposal Number: ${proposalNo}`);

  let proposal = await governor.proposals(proposalNo);
  const { startBlock } = proposal;

  // Advance to vote start
  if (toBN(await time.latestBlock()).lt(toBN(startBlock))) {
    console.log(`Advancing To: ${startBlock}`);
    await time.advanceBlockTo(startBlock);
  } else {
    console.log('Vote already began');
  }

  proposal = await governor.proposals(proposalNo);
  const { endBlock } = proposal;

  // Advance to after vote completes and queue the transaction
  if (toBN(await time.latestBlock()).lt(toBN(endBlock))) {
    await governor.connect(signer).castVote(proposalNo, 1);
    console.log('Casted vote');

    console.log(`Advancing To: ${endBlock}`);
    await time.advanceBlockTo(endBlock);

    console.log('Queuing');
    await governor['queue(uint256)'](proposalNo);
  } else {
    console.log('Already queued');
  }

  // Increase beyond the timelock delay
  console.log('Increasing Time');
  await time.increase(200000); // ~2 days in seconds

  console.log('Executing');
  await governor['execute(uint256)'](proposalNo, { value: totalValue });
  console.log('Success');
}
