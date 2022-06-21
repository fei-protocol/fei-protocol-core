import constructProposal from './constructProposal';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { Interface } from '@ethersproject/abi';
import { utils } from 'ethers';
import { getAllContractAddresses, getAllContracts } from '@test/integration/setup/loadContracts';
import { ProposalCategory, ProposalDescription, TemplatedProposalDescription } from '@custom-types/types';
import proposals from '@protocol/proposalsConfig';

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
export async function constructProposalCalldata(proposalName: string): Promise<string> {
  const proposalInfo = (await import(`@proposals/description/${proposalName}`)).default as TemplatedProposalDescription;

  const contracts = await getAllContracts();
  const contractAddresses = getAllContractAddresses();

  const proposal = (await constructProposal(proposalInfo, contracts, contractAddresses)) as ExtendedAlphaProposal;

  console.log(proposals[proposalName].category);
  if (
    proposals[proposalName].category === ProposalCategory.OA ||
    proposals[proposalName].category === ProposalCategory.TC
  ) {
    return getTimelockCalldata(proposal, proposalInfo);
  }

  return getDAOCalldata(proposal);
}

function getDAOCalldata(proposal: ExtendedAlphaProposal): string {
  const proposeFuncFrag = new Interface([
    'function propose(address[] memory targets,uint256[] memory values,bytes[] memory calldatas,string memory description) public returns (uint256)'
  ]);

  const combinedCalldatas = [];
  for (let i = 0; i < proposal.targets.length; i++) {
    const sighash = utils.id(proposal.signatures[i]).slice(0, 10);
    combinedCalldatas.push(`${sighash}${proposal.calldatas[i].slice(2)}`);
  }

  const calldata = proposeFuncFrag.encodeFunctionData('propose', [
    proposal.targets,
    proposal.values,
    combinedCalldatas,
    proposal.description
  ]);

  return calldata;
}

function getTimelockCalldata(proposal: ExtendedAlphaProposal, proposalInfo: TemplatedProposalDescription): string {
  const proposeFuncFrag = new Interface([
    'function scheduleBatch(address[] calldata targets,uint256[] calldata values,bytes[] calldata data,bytes32 predecessor,bytes32 salt,uint256 delay) public',
    'function executeBatch(address[] calldata targets,uint256[] calldata values,bytes[] calldata data,bytes32 predecessor,bytes32 salt) public'
  ]);

  const combinedCalldatas = [];
  for (let i = 0; i < proposal.targets.length; i++) {
    const sighash = utils.id(proposal.signatures[i]).slice(0, 10);
    combinedCalldatas.push(`${sighash}${proposal.calldatas[i].slice(2)}`);
  }

  const salt = ethers.utils.id(proposalInfo.title);
  const predecessor = ethers.constants.HashZero;

  const calldata = proposeFuncFrag.encodeFunctionData('scheduleBatch', [
    proposal.targets,
    proposal.values,
    combinedCalldatas,
    predecessor,
    salt,
    345600
  ]);

  const executeCalldata = proposeFuncFrag.encodeFunctionData('executeBatch', [
    proposal.targets,
    proposal.values,
    combinedCalldatas,
    predecessor,
    salt
  ]);

  return `Calldata: ${calldata}\nExecute Calldata: ${executeCalldata}`;
}
