import { NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { StateConfig, StateConfigEntryNames } from '@protocol/stateConfig';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

describe('e2e-state-config', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

  before(async function () {
    // Setup test environment and get contracts
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    const config = {
      logging: Boolean(process.env.LOGGING),
      deployAddress: deployAddress,
      version: 1
    };

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    config.logging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    config.logging && console.log(`Environment loaded.`);
  });

  it('Procotol State Configuration', async function () {
    for (const contractName of StateConfigEntryNames) {
      console.log(`Checking ${contractName} state configs...`);

      const stateConfigEntry = StateConfig[contractName];
      const contract = contracts[contractName];

      for (const keyName of Object.keys(stateConfigEntry)) {
        const expectedValue = stateConfigEntry[keyName as keyof typeof stateConfigEntry];
        const actualValue = await contract[keyName]();

        expect(actualValue).to.be.equal(
          expectedValue,
          `Expected ${contractName} to have ${keyName} set to ${expectedValue}, got ${actualValue}`
        );
      }
    }
  });
});
