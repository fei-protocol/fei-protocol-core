import hre, { proposals } from 'hardhat';
import { MainnetContracts, NamedAddresses, ProposalDescription } from '@custom-types/types';
import format from 'string-template';
import { AlphaProposal } from '@idle-finance/hardhat-proposals-plugin/dist/src/proposals/compound-alpha';
import { BigNumber } from 'ethers';
import { InternalProposalState } from '@idle-finance/hardhat-proposals-plugin/dist/src/proposals/proposal';
import { HardhatPluginError } from 'hardhat/plugins';
import { PACKAGE_NAME, errors } from '@idle-finance/hardhat-proposals-plugin/dist/src/constants';

export class SigmaProposal extends AlphaProposal {
  protected async mineBlocks(blocks: any) {
    const blocksToMine = BigNumber.from(blocks).toNumber();
    await hre.network.provider.send('hardhat_mine', [blocksToMine]);
  }

  async simulate(fullSimulation = false, force?: boolean) {
    if (this.internalState != InternalProposalState.UNSUBMITTED && !force) {
      throw new HardhatPluginError(PACKAGE_NAME, errors.ALREADY_SIMULATED);
    }

    if (fullSimulation) await this._fullSimulate();
    else await this._simulate();

    this.internalState = InternalProposalState.SIMULATED;
  }
}

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
  proposalBuilder.maxActions = 50;

  for (let i = 0; i < proposalInfo.commands.length; i += 1) {
    const command = proposalInfo.commands[i];
    const ethersContract = contracts[command.target];

    const args = replaceArgs(command.arguments, contractAddresses);
    proposalBuilder.addContractAction(ethersContract, command.method, args, command.values);

    logging && console.log(`Adding proposal step: ${command.description}`);
  }

  proposalBuilder.setDescription(`${proposalInfo.title}\n${proposalDescription.toString()}`); // Set proposal description

  const proposal = proposalBuilder.build();
  proposal.simulate = new SigmaProposal(hre).simulate;
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
