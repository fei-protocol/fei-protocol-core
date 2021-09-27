import { getAllContracts, getAllContractAddresses } from '../../test/integration/setup/loadContracts';
import hre, { ethers } from 'hardhat';
import { time } from '@openzeppelin/test-helpers';
import { NamedContracts, UpgradeFuncs } from '../../test/integration/setup/types';

import * as dotenv from 'dotenv';

dotenv.config();

// Multisig
const voterAddress = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775';

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */
async function checkProposal() {
  const proposalName = process.env.DEPLOY_FILE;

  if (!proposalName) {
    throw new Error('DEPLOY_FILE env variable not set');
  }

  const contracts = await getAllContracts();

  const { governorAlpha } = contracts;

  const proposalNo = process.env.PROPOSAL_NUMBER ? process.env.PROPOSAL_NUMBER : await governorAlpha.proposalCount();

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [voterAddress]
  });

  const voterSigner = await ethers.getSigner(voterAddress);

  console.log(`Proposal Number: ${proposalNo}`);

  let proposal = await governorAlpha.proposals(proposalNo);
  const { startBlock } = proposal;

  // Advance to vote start
  if ((await time.latestBlock()) < startBlock) {
    console.log(`Advancing To: ${startBlock}`);
    await time.advanceBlockTo(Number(startBlock.toString()));
  } else {
    console.log('Vote already began');
  }

  /*try {*/
  await governorAlpha.connect(voterSigner).castVote(proposalNo, true);
  console.log('Casted vote.');
  /*} catch {
    console.log('Already voted, ror some terrible error has occured.');
  }*/

  proposal = await governorAlpha.proposals(proposalNo);
  const { endBlock } = proposal;

  // Advance to after vote completes and queue the transaction
  if ((await time.latestBlock()) < endBlock) {
    console.log(`Advancing To: ${endBlock}`);
    await time.advanceBlockTo(Number(endBlock.toString()));

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
  const proposalFuncs: UpgradeFuncs = await import(`../../proposals/dao/${proposalName}`);

  const contractAddresses = getAllContractAddresses();

  console.log('Teardown');
  await proposalFuncs.teardown(
    contractAddresses,
    contracts as unknown as NamedContracts,
    contracts as unknown as NamedContracts,
    true
  );

  console.log('Validate');
  await proposalFuncs.validate(
    contractAddresses,
    contracts as unknown as NamedContracts,
    contracts as unknown as NamedContracts,
    true
  );
}

checkProposal()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
