import { getAllContracts, getAllContractAddresses } from '@test/integration/setup/loadContracts';
import { getImpersonatedSigner, time } from '@test/helpers';
import { NamedContracts, UpgradeFuncs } from '@custom-types/types';

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
  const proposalNo = process.env.PROPOSAL_NUMBER;

  if (!proposalName || !proposalNo) {
    throw new Error('DEPLOY_FILE or PROPOSAL_NUMBER env variable not set');
  }

  // Get the upgrade setup, run and teardown scripts
  const proposalFuncs: UpgradeFuncs = await import(`@proposals/dao/${proposalName}`);

  const contracts = (await getAllContracts()) as NamedContracts;

  const contractAddresses = await getAllContractAddresses();

  if (process.env.DO_SETUP) {
    console.log('Setup');
    await proposalFuncs.setup(
      contractAddresses,
      contracts as unknown as NamedContracts,
      contracts as unknown as NamedContracts,
      true
    );
  }

  const { feiDAO } = contracts;

  const voterSigner = await getImpersonatedSigner(voterAddress);

  console.log(`Proposal Number: ${proposalNo}`);

  let proposal = await feiDAO.proposals(proposalNo);
  const { startBlock } = proposal;

  // Advance to vote start
  if ((await time.latestBlock()) < startBlock) {
    console.log(`Advancing To: ${startBlock}`);
    await time.advanceBlockTo(Number(startBlock.toString()));
  } else {
    console.log('Vote already began');
  }

  try {
    await feiDAO.connect(voterSigner).castVote(proposalNo, 1);
    console.log('Casted vote.');
  } catch {
    console.log('Already voted, or some terrible error has occured.');
  }

  proposal = await feiDAO.proposals(proposalNo);
  const { endBlock } = proposal;

  // Advance to after vote completes and queue the transaction
  if ((await time.latestBlock()) < endBlock) {
    console.log(`Advancing To: ${endBlock}`);
    await time.advanceBlockTo(Number(endBlock.toString()));

    console.log('Queuing');

    await feiDAO['queue(uint256)'](proposalNo);
  } else {
    console.log('Already queued');
  }

  // Increase beyond the timelock delay
  console.log('Increasing Time');
  await time.increase(86400); // 1 day in seconds

  console.log('Executing');
  try {
    await feiDAO['execute(uint256)'](proposalNo);
  } catch {
    console.log('Already executed, or some terrible error has occured.');
  }
  console.log('Success');

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
