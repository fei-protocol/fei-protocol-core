import { proposals } from 'hardhat';
import { MainnetContracts, NamedAddresses, ProposalDescription } from '@custom-types/types';
import format from 'string-template';
import { AlphaProposal } from '@idle-finance/hardhat-proposals-plugin/dist/src/proposals/compound-alpha';

/**
 * Constucts a hardhat proposal object
 * https://github.com/Idle-Finance/hardhat-proposals-plugin/blob/main/src/proposals/proposal.ts
 *
 */
export default async function constructProposal(
  proposalInfo: ProposalDescription,
  contracts: MainnetContracts,
  contractAddresses: NamedAddresses,
  logging = false
): Promise<AlphaProposal> {
  logging && console.log(`Constructing proposal...`);

  const proposalDescription = proposalInfo.description;

  const proposalBuilder = proposals.builders.alpha();
  proposalBuilder.maxActions = 40;

  for (let i = 0; i < proposalInfo.commands.length; i += 1) {
    const command = proposalInfo.commands[i];
    const ethersContract = contracts[command.target];

    const args = replaceArgs(command.arguments, contractAddresses);
    proposalBuilder.addContractAction(ethersContract, command.method, args, command.values);

    logging && console.log(`Adding proposal step: ${command.description}`);
  }

  proposalBuilder.setDescription(`${proposalInfo.title}\n${proposalDescription.toString()}`); // Set proposal description

  const proposal = proposalBuilder.build();
  logging && console.log(await proposal.printProposalInfo());
  return proposal;
}

// Recursively interpolate strings in the argument array
const replaceArgs = (args: any[], contractNames: NamedAddresses) => {
  const result = [];
  for (let i = 0; i < args.length; i++) {
    const element = args[i];
    if (typeof element === typeof '') {
      const formatted = format(element, contractNames);
      result.push(formatted);
    } else if (typeof element === typeof []) {
      result.push(replaceArgs(element, contractNames));
    } else {
      result.push(element);
    }
  }
  return result;
};
