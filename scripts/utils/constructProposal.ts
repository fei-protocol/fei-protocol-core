import { getAllContractAddresses, getAllContracts } from '../../test/integration/setup/loadContracts';
import fs from 'fs';
import { proposals } from 'hardhat';
import { MainnetContracts, NamedAddresses } from '@custom-types/types';
import format from 'string-template';

/**
 * Constucts a hardhat proposal object
 * https://github.com/Idle-Finance/hardhat-proposals-plugin/blob/main/src/proposals/proposal.ts
 *
 * Uses the data in `proposals/description/${proposalName}.json` for the commands
 * Uses the text in `proposals/description/${proposalName}.txt` for the description
 */
export default async function constructProposal(proposalName: string, logging = false) {
  console.log(`Constructing proposal...`);
  const proposalInfo = await import(`../../proposals/description/${proposalName}`);
  const proposalDescription = fs.readFileSync(`${__dirname}/../../proposals/description/${proposalName}.txt`);

  const contracts: MainnetContracts = await getAllContracts();
  const contractAddresses: NamedAddresses = await getAllContractAddresses();

  const proposalBuilder = proposals.builders.alpha();
  proposalBuilder.maxActions = 40;

  for (let i = 0; i < proposalInfo.proposal_commands.length; i += 1) {
    const command = proposalInfo.proposal_commands[i];
    const ethersContract = contracts[command.target];

    const args = replaceArgs(command.arguments, contractAddresses);
    proposalBuilder.addContractAction(ethersContract, command.method, args, command.values);

    logging && console.log(`Adding proposal step: ${command.description}`);
  }

  proposalBuilder.setDescription(`${proposalInfo.proposal_title}\n${proposalDescription.toString()}`); // Set proposal description

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
}
