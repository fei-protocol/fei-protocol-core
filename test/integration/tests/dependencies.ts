import { expect } from 'chai';
import { DependencyMap, Dependency } from '@custom-types/types';
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
        const contracts = getProposalContracts(proposalName);
        doLogging && console.log(`Checking proposal: ${proposalName}`);

        for (let j = 0; j < contracts.length; j++) {
          const contract = contracts[j];
          doLogging && console.log(`Checking contract: ${contract}`);
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

function getProposalContracts(proposal): string[] {
  return ['contract'];
}
