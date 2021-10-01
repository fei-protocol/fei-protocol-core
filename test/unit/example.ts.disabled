import { getAddresses, getCore } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import hre, { ethers } from 'hardhat';
import { Core, Timelock, Timelock__factory } from '@custom-types/contracts';
import chai from 'chai';

// This will theoretically make the error stack actually print!
chai.config.includeStack = true

// Import if needed, just a helper.
// const toBN = ethers.BigNumber.from;

describe.skip('example', async () => {
  // variable decs for vars that you want to use in multiple tests
  // typeing contracts specifically to what kind they are will catch before you run them!
  let core: Core;
  let timelock: Timelock;

  const impersonatedSigners: { [key: string]: Signer } = {};

  // add any addresses that you want to get here
  const { userAddress, governorAddress, pcvControllerAddress } = await getAddresses();

  before(async () => {
    // add any addresses you want to impersonate here
    const impersonatedAddresses = [userAddress, governorAddress];

    for (const address of impersonatedAddresses) {
      await hre.network.provider.request({
        method: 'hardhat_impersonateAccount',
        params: [address]
      });

      impersonatedSigners[address] = await ethers.getSigner(address);
    }
  });

  beforeEach(async () => {
    // If the forked-network state needs to be reset between each test, run this
    // await network.provider.request({method: 'hardhat_reset', params: []});

    // Do any pre-test setup here
    core = await getCore();

    // To deploy a contract, import and use the contract factory specific to that contract
    // note that the signer supplied is optional
    const timelockDeployer = new Timelock__factory(impersonatedSigners[userAddress]);
    timelock = await timelockDeployer.deploy(userAddress, 1, 1);
  });

  // Try and do as much deployment in beforeEach, and as much testing in the actual functions
  describe('Init', function () {
    it('timelock delay is correct', async () => {
      expect(await timelock.delay()).to.equal(1);
    });
  });
});
