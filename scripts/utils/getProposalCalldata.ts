import constructProposal from './constructProposal';
import hre, { web3, ethers } from 'hardhat';
import * as dotenv from 'dotenv';
import { BigNumber } from 'ethers';
import { Interface } from '@ethersproject/abi';


dotenv.config();

type ExtendedAlphaProposal = {
  targets: string[];
  values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  description: string;
}

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */
async function getProposalCalldata() {
  const proposalName = process.env.DEPLOY_FILE;

  if (!proposalName) {
    throw new Error('DEPLOY_FILE env variable not set');
  }

  const proposal = await constructProposal(proposalName) as ExtendedAlphaProposal;

  const governorAlphaArtifact = await hre.artifacts.readArtifactSync('GovernorAlpha')
  const governorAlphaInterface = new Interface(governorAlphaArtifact.abi)

  const calldata = governorAlphaInterface.encodeFunctionData('propose', [proposal.targets, proposal.values, proposal.signatures, proposal.calldatas, proposal.description])

  console.log(calldata);
}

getProposalCalldata()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
