import { NamedContracts } from '@custom-types/types';
import { pauseStateConfig } from '@protocol/pauseState';
import proposals from '@protocol/proposalsConfig';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

describe('e2e-pause-state', function () {
  let contracts: NamedContracts;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  before(async () => {
    chai.use(CBN(ethers.BigNumber));
    chai.use(solidity);
  });

  before(async function () {
    // Setup test environment and get contracts
    const version = 1;
    deployAddress = (await ethers.getSigners())[0].address;
    if (!deployAddress) throw new Error(`No deploy address!`);

    doLogging = Boolean(process.env.LOGGING);

    const config = {
      logging: doLogging,
      deployAddress: deployAddress,
      version: version
    };

    e2eCoord = new TestEndtoEndCoordinator(config, proposals);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  it('should reflect on-chain protocol pause state', async function () {
    const pausedContractNames = Object.keys(pauseStateConfig);

    for (let i = 0; i < pausedContractNames.length; i += 1) {
      const pausedContractName = pausedContractNames[i];
      const expectedContractPauseConfig = pauseStateConfig[pausedContractName];

      // Get the on-chain contract
      const onChainContract = contracts[pausedContractName];

      const onChainPauseState = await onChainContract.paused();
      expect(onChainPauseState).to.be.equal(expectedContractPauseConfig.paused, 'paused() state incorrect');

      // Validate PSM related pausing
      if (expectedContractPauseConfig.redeemPaused) {
        expect(await onChainContract.redeemPaused()).to.be.equal(
          expectedContractPauseConfig.redeemPaused,
          'redeemPaused() state incorrect'
        );
      }

      if (expectedContractPauseConfig.mintPaused) {
        expect(await onChainContract.mintPaused()).to.be.equal(
          expectedContractPauseConfig.mintPaused,
          'mintPaused() state incorrect'
        );
      }
    }
  });
});
