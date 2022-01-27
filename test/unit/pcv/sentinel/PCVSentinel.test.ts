import { expectRevert, getAddresses, getCore, getImpersonatedSigner } from '@test/helpers';
import { expect } from 'chai';
import { Signer } from 'ethers';
import { ethers } from 'hardhat';
import {
  Core,
  MockERC20__factory,
  MockPCVDepositV2__factory,
  PCVDeposit,
  PCVSentinel,
  MockERC20
} from '@custom-types/contracts';
import chai from 'chai';
import { forceEth } from '@test/integration/setup/utils';

// This will theoretically make the error stack actually print!
chai.config.includeStack = true;

// Import if needed, just a helper.
// const toBN = ethers.BigNumber.from;

describe('PCV Sentinel', function () {
  // variable decs for vars that you want to use in multiple tests
  // typeing contracts specifically to what kind they are will catch before you run them!
  let core: Core;
  let pcvSentinel: PCVSentinel;

  let userAddress: string;
  let userAddress2: string;
  let pcvControllerAddress: string;
  let governorAddress: string;
  let guardianAddress: string;

  const impersonatedSigners: { [key: string]: Signer } = {};

  before(async () => {
    // add any addresses that you want to get here
    const addresses = await getAddresses();

    userAddress = addresses.userAddress;
    userAddress2 = addresses.secondUserAddress;
    pcvControllerAddress = addresses.pcvControllerAddress;
    governorAddress = addresses.governorAddress;
    guardianAddress = addresses.guardianAddress;

    // add any addresses you want to impersonate here
    const impersonatedAddresses = [userAddress, pcvControllerAddress, governorAddress, guardianAddress];

    for (const address of impersonatedAddresses) {
      impersonatedSigners[address] = await getImpersonatedSigner(address);
    }
  });

  beforeEach(async () => {
    // If the forked-network state needs to be reset between each test, run this
    // await network.provider.request({method: 'hardhat_reset', params: []});

    // Do any pre-test setup here
    core = await getCore();

    const pcvSentinelFactory = await ethers.getContractFactory('PCVSentinel');

    pcvSentinel = await pcvSentinelFactory.deploy(core.address);
    await pcvSentinel.deployTransaction.wait();

    // To deploy a contract, import and use the contract factory specific to that contract
    // note that the signer supplied is optional
  });

  // Try and do as much deployment in beforeEach, and as much testing in the actual functions

  describe('initial conditions', async () => {});

  describe('access control', async () => {});

  describe('sentinel with no-op guard', async () => {});

  describe('sentinel with basic condition check', async () => {});

  describe('sentinel with multi-action guard', async () => {});

  describe('sentinel with several guards', async () => {});

  describe('sentinel with failing guards', async () => {});
});
