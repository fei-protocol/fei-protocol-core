import constructProposal from './constructProposal';
import { BigNumber } from 'ethers';
import { ethers } from 'hardhat';
import { Interface } from '@ethersproject/abi';
import { utils } from 'ethers';
import { getAllContractAddresses, getAllContracts } from '@test/integration/setup/loadContracts';
import { ProposalCategory, TemplatedProposalDescription } from '@custom-types/types';
import proposals from '@protocol/proposalsConfig';
import { TRIBAL_COUNCIL_POD_ID } from '@protocol/optimisticGovernance';
import { abi as TimelockControllerABI } from '../../artifacts/@openzeppelin/contracts/governance/TimelockController.sol/TimelockController.json';
import { abi as FeiDAOABI } from '../../artifacts/contracts/dao/governor/FeiDAO.sol/FeiDAO.json';
import { abi as MetadataRegistryABI } from '../../artifacts/contracts/pods/GovernanceMetadataRegistry.sol/GovernanceMetadataRegistry.json';

type ExtendedAlphaProposal = {
  targets: string[];
  values: BigNumber[];
  signatures: string[];
  calldatas: string[];
  description: string;
};

export interface PodConfig {
  id: number;
}

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
  if (proposals[proposalName].category === ProposalCategory.TC) {
    const podConfig: PodConfig = { id: TRIBAL_COUNCIL_POD_ID };
    return getTimelockCalldata(proposal, proposalInfo, podConfig);
  } else if (proposals[proposalName].category === ProposalCategory.OA) {
    return getTimelockCalldata(proposal, proposalInfo);
  }

  return getDAOCalldata(proposal);
}

function getDAOCalldata(proposal: ExtendedAlphaProposal): string {
  const feiDAOInterface = new Interface(FeiDAOABI);

  const combinedCalldatas = [];
  for (let i = 0; i < proposal.targets.length; i++) {
    const sighash = utils.id(proposal.signatures[i]).slice(0, 10);
    combinedCalldatas.push(`${sighash}${proposal.calldatas[i].slice(2)}`);
  }

  const calldata = feiDAOInterface.encodeFunctionData('propose', [
    proposal.targets,
    proposal.values,
    combinedCalldatas,
    proposal.description
  ]);

  return calldata;
}

function getTimelockCalldata(
  proposal: ExtendedAlphaProposal,
  proposalInfo: TemplatedProposalDescription,
  podConfig?: PodConfig
): string {
  const timelockControllerInterface = new Interface(TimelockControllerABI);
  const metadataRegistryInterface = new Interface(MetadataRegistryABI);

  const combinedCalldatas = [];
  for (let i = 0; i < proposal.targets.length; i++) {
    const sighash = utils.id(proposal.signatures[i]).slice(0, 10);
    combinedCalldatas.push(`${sighash}${proposal.calldatas[i].slice(2)}`);
  }

  const salt = ethers.utils.id(proposalInfo.title);
  const predecessor = ethers.constants.HashZero;

  const calldata = timelockControllerInterface.encodeFunctionData('scheduleBatch', [
    proposal.targets,
    proposal.values,
    combinedCalldatas,
    predecessor,
    salt,
    345600
  ]);

  const executeCalldata = timelockControllerInterface.encodeFunctionData('executeBatch', [
    proposal.targets,
    proposal.values,
    combinedCalldatas,
    predecessor,
    salt
  ]);

  if (podConfig) {
    const proposalId = computeBatchProposalId(proposal.targets, proposal.values, combinedCalldatas, predecessor, salt);
    const registerMetadataCalldata = metadataRegistryInterface.encodeFunctionData('registerProposal', [
      podConfig.id,
      proposalId,
      proposal.description
    ]);
    return `Calldata: ${calldata}\nMetadata Calldata: ${registerMetadataCalldata}\nExecute Calldata: ${executeCalldata}`;
  } else {
    return `Calldata: ${calldata}\nExecute Calldata: ${executeCalldata}`;
  }
}

export function computeBatchProposalId(
  targets: string[],
  values: BigNumber[],
  payloads: string[],
  predecessor: string,
  salt: string
): string {
  const dataToHash = ethers.utils.defaultAbiCoder.encode(
    ['address[]', 'uint256[]', 'bytes[]', 'bytes32', 'bytes32'],
    [targets, values.map((x) => x.toString()), payloads, predecessor, salt]
  );
  return ethers.utils.keccak256(dataToHash);
}
