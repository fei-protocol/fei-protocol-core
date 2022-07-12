import { NamedContracts } from '@custom-types/types';
import { ProposalsConfig } from '@protocol/proposalsConfig';
import { SafeAddressesConfig } from '@protocol/safeAddresses';
import { TestEndtoEndCoordinator } from '@test/integration/setup';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { ethers } from 'hardhat';

describe('e2e-pcv-guardian-safe-addresses', function () {
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

    e2eCoord = new TestEndtoEndCoordinator(config, ProposalsConfig);

    doLogging && console.log(`Loading environment...`);
    ({ contracts } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  // If each address in the local config is a safe address and the total number
  // of safe addresses match up, then by definition safe address state is correct
  it('should reflect PCV Guardian safe addresses on-chain', async function () {
    const pcvGuardian = contracts.pcvGuardian;
    const allAddressesOnChain = await pcvGuardian.getSafeAddresses();

    const numAddressesOnChain = allAddressesOnChain.length;
    const numAddressesLocally = SafeAddressesConfig.length;
    expect(numAddressesOnChain).to.be.equal(numAddressesLocally, 'Num safe addresses mismatch');

    for (let i = 0; i < SafeAddressesConfig.length; i += 1) {
      const safeAddressContractName = SafeAddressesConfig[i];

      // Get the on-chain contract
      const onChainContract = contracts[safeAddressContractName];

      // Validate is a safe address
      expect(await pcvGuardian.isSafeAddress(onChainContract.address)).to.be.equal(
        true,
        'Expected ' + safeAddressContractName + ' to be a safe address'
      );
    }
  });
});
