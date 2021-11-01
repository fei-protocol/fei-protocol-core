import { expect } from 'chai';
import { ProposalDescription } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';
import dependencies from '@addresses/dependencies';

describe('e2e-dependencies', function () {
  const doLogging = Boolean(process.env.LOGGING);
  let proposalNames: string[];

  before(function () {
    proposalNames = Object.keys(proposals);
  });

  describe('Check Dependencies', function () {
    it('all dependencies signed off', async function () {
      for (let i = 0; i < proposalNames.length; i++) {
        const proposalName = proposalNames[i];
        const contracts = getProposalContracts(proposals[proposalName].proposal);
        doLogging && console.log(`Checking proposal: ${proposalName}`);
        doLogging && console.log(`Proposal affects contracts: ${contracts}`);

        for (let j = 0; j < contracts.length; j++) {
          const contract = contracts[j];
          doLogging && console.log(`Checking contract: ${contract}`);
          // Make sure all contracts are in dependencies map
          expect(dependencies).to.haveOwnProperty(contract);

          // Make sure this contract has this fip signed off
          expect(dependencies[contract].fips).to.haveOwnProperty(proposalName);
        }
      }
    });

    it('all dependencies bidirectional', async function () {
      const contractNames = Object.keys(dependencies);
      for (let i = 0; i < contractNames.length; i++) {
        const contract = contractNames[i];
        const contractDependencies = dependencies[contract].contractDependencies;
        for (let j = 0; j < contractDependencies.length; j++) {
          const dependency = contractDependencies[j];
          expect(dependencies).to.haveOwnProperty(dependency);
          expect(dependencies[dependency].contractDependencies).to.contain(contract);
        }
      }
    });
  });
});

function getProposalContracts(proposal: ProposalDescription): string[] {
  let contracts = [];

  for (let i = 0; i < proposal.commands.length; i++) {
    const command = proposal.commands[i];
    contracts.push(command.target);
    contracts = contracts.concat(getContractsFromArgs(command.arguments));
  }

  // dedup
  return [...new Set(contracts)];
}

function getContractsFromArgs(args: any[]): string[] {
  let result: string[] = [];
  for (let i = 0; i < args.length; i++) {
    const element = args[i];
    if (typeof element === typeof '') {
      // find all contracts
      let formatted: string[] = element.match(/\{\w+\}/g);
      formatted = formatted || [];

      // Remove braces
      formatted = formatted.map((item) => item.replace('{', '').replace('}', ''));

      result = result.concat(formatted);
    } else if (typeof element === typeof []) {
      // recurse through levels of array
      const moreContracts: string[] = getContractsFromArgs(element);
      result = result.concat(moreContracts);
    }
  }
  return result;
}
