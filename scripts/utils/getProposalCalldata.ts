import constructProposal from './constructProposal';
import * as dotenv from 'dotenv';
import { BigNumber } from 'ethers';
import { Interface } from '@ethersproject/abi';
import { utils } from 'ethers';

dotenv.config();

type ExtendedAlphaProposal = {
  targets: string[];
  values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  description: string;
};

/**
 * Take in a hardhat proposal object and output the proposal calldatas
 * See `proposals/utils/getProposalCalldata.js` on how to construct the proposal calldata
 */
async function getProposalCalldata() {
  const proposalName = process.env.DEPLOY_FILE;

  if (!proposalName) {
    throw new Error('DEPLOY_FILE env variable not set');
  }

  const proposal = (await constructProposal(proposalName)) as ExtendedAlphaProposal;

  const proposeFuncFrag = new Interface([
    'function propose(address[] memory targets,uint256[] memory values,bytes[] memory calldatas,string memory description) public returns (uint256)'
  ]);

  const combinedCalldatas = [];
  for (let i = 0; i < proposal.targets.length; i++) {
    const sighash = utils.id(proposal.signatures[i]).slice(0, 10);
    combinedCalldatas.push(`${sighash}${proposal.calldatas[i].slice(2)}`);
  }

  console.log(combinedCalldatas);

  const calldata = proposeFuncFrag.encodeFunctionData('propose', [
    proposal.targets,
    proposal.values,
    combinedCalldatas,
    proposal.description
  ]);

  console.log(calldata);
}

getProposalCalldata()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
