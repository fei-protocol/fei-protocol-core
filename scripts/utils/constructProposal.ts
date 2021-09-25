import { getAllContracts } from '../../test/integration/setup/loadContracts';

const fs = require('fs');

const { proposals } = require('hardhat');

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

  const contracts = await getAllContracts();
  const proposalBuilder = proposals.builders.alpha();

  for (let i = 0; i < proposalInfo.proposal_commands.length; i += 1) {
    const command = proposalInfo.proposal_commands[i];
    const ethersContract = contracts[command.target];

    proposalBuilder.addContractAction(ethersContract, command.method, command.arguments, command.values);

    logging && console.log(`Adding proposal step: ${command.description}`);
  }

  proposalBuilder.setDescription(`${proposalInfo.proposal_title}\n${proposalDescription.toString()}`); // Set proposal description

  const proposal = proposalBuilder.build();
  logging && console.log(await proposal.printProposalInfo());
  return proposal;
}
