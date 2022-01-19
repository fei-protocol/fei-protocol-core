import { expect } from 'chai';
import { ProposalCategory, ProposalDescription } from '@custom-types/types';
import proposals from '@test/integration/proposals_config';
import dependencies from '@protocol/dependencies';
import addresses from '@protocol/mainnetAddresses';
import collateralizationAddresses from '@protocol/collateralizationOracle';
import { AddressCategory } from '@custom-types/types'; // imported without custom path to allow docs to autogen without ts errors

describe('e2e-dependencies', function () {
  const doLogging = Boolean(process.env.LOGGING);
  let proposalNames: string[];

  before(function () {
    proposalNames = Object.keys(proposals);
  });

  describe('Check Dependencies', function () {
    it('are all signed off', async function () {
      for (let i = 0; i < proposalNames.length; i++) {
        const proposalName = proposalNames[i];
        if (proposals[proposalName].category === ProposalCategory.None || proposals[proposalName].deploy) {
          // Skip if not a DAO/OA proposal or not yet deployed
          doLogging && console.log(`Skipping: ${proposalName}`);
          continue;
        }

        const contracts = getProposalContracts(proposals[proposalName].proposal);
        doLogging && console.log(`Checking proposal: ${proposalName}`);
        doLogging && console.log(`Proposal affects contracts: ${contracts}`);

        for (let j = 0; j < contracts.length; j++) {
          const contract = contracts[j];
          doLogging && console.log(`Contract: ${contract}`);
          const category = addresses[contract].category;
          if (category === AddressCategory.External) {
            continue;
          }

          if (category === AddressCategory.Deprecated) {
            doLogging && console.log(`Checking deprecated contract: ${contract}`);

            expect(dependencies).to.not.haveOwnProperty(contract);

            // Make sure proposal config has this deprecated contract signed off
            expect(proposals[proposalName].deprecatedContractSignoff).to.contain(contract);
            continue;
          }

          doLogging && console.log(`Checking contract: ${contract}`);

          expect(dependencies).to.haveOwnProperty(contract);

          // Make sure proposal config has this fip signed off
          expect(proposals[proposalName].affectedContractSignoff).to.contain(contract);
        }
      }
    });

    it('all have contract category correct', async function () {
      for (let i = 0; i < proposalNames.length; i++) {
        const proposalName = proposalNames[i];
        const contracts = proposals[proposalName].affectedContractSignoff;
        const deprecated = proposals[proposalName].deprecatedContractSignoff;

        if (proposals[proposalName].deploy) {
          // Skip these checks if not mainnet deployed
          doLogging && console.log(`Skipping: ${proposalName}`);
          continue;
        }
        doLogging && console.log(`Checking proposal: ${proposalName}`);
        doLogging && console.log(`Proposal affects contracts: ${contracts}`);

        for (let j = 0; j < contracts.length; j++) {
          const contract = contracts[j];
          const category = addresses[contract].category;
          expect(category).to.not.be.equal(AddressCategory.External);
          expect(category).to.not.be.equal(AddressCategory.Deprecated);

          expect(deprecated).to.not.contain(contract);
        }

        for (let j = 0; j < deprecated.length; j++) {
          const contract = deprecated[j];
          const category = addresses[contract].category;
          expect(category).to.be.equal(AddressCategory.Deprecated);

          expect(contracts).to.not.contain(contract);
        }
      }
    });

    it('collateralization oracle deposits category correct', async function () {
      const tokenAddresses = Object.keys(collateralizationAddresses);
      const crDeposits = [];
      for (let i = 0; i < tokenAddresses.length; i++) {
        const element = tokenAddresses[i];

        const deposits = collateralizationAddresses[element];

        for (let i = 0; i < deposits.length; i++) {
          const deposit = deposits[i];
          crDeposits.push(deposit);

          doLogging && console.log(`${element} contract address: ${deposit}`);
          expect(addresses[deposit].category).to.not.be.equal('Deprecated');
        }
      }

      const mainnetAddresses = Object.keys(addresses);

      for (let i = 0; i < mainnetAddresses.length; i++) {
        const element = mainnetAddresses[i];

        const category = addresses[element].category;

        if (category === 'PCV') {
          expect(crDeposits).to.contain(element);
        }
      }
    });

    it('are listed bidirectionally', async function () {
      const contractNames = Object.keys(dependencies);
      for (let i = 0; i < contractNames.length; i++) {
        const contract = contractNames[i];
        doLogging && console.log(`Checking contract: ${contract}`);
        const contractDependencies = dependencies[contract].contractDependencies;
        for (let j = 0; j < contractDependencies.length; j++) {
          const dependency = contractDependencies[j];
          doLogging && console.log(`Checking contract dependency: ${dependency}`);
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
