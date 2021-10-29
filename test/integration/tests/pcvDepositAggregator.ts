import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { solidity } from 'ethereum-waffle';
import { Contract } from 'ethers';
import hre, { ethers } from 'hardhat';
import { NamedAddresses, NamedContracts } from '@custom-types/types';
import { expectApprox, resetFork, time } from '@test/helpers';
import proposals from '@test/integration/proposals_config.json';
import { TestEndtoEndCoordinator } from '../setup';
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

// We will drip 4 million tribe per week
const dripAmount = toBN(4000000).mul(toBN(10).pow(toBN(18)));
// number of seconds between allowed drips
// this is 1 week in seconds
const dripFrequency = 604800;

before(async () => {
  chai.use(CBN(ethers.BigNumber));
  chai.use(solidity);
  await resetFork();
});

describe('e2e-pcv', function () {
  let contracts: NamedContracts;
  let contractAddresses: NamedAddresses;
  let deployAddress: string;
  let e2eCoord: TestEndtoEndCoordinator;
  let doLogging: boolean;

  const tenPow18 = toBN('1000000000000000000');

  beforeEach(async function () {
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
    ({ contracts, contractAddresses } = await e2eCoord.loadEnvironment());
    doLogging && console.log(`Environment loaded.`);
  });

  describe('iterated flow of add, remove, deposit, withdraw', async () => {
    throw new Error('Method not yet implemented.');
  });

  describe('iterated flow focusing on changing the buffer and deposit weights', async () => {
    throw new Error('Method not yet impelmented.');
  });

  describe('iterated flow focusing on withdrawing and depositing', async () => {
    throw new Error('Method not yet impelmented.');
  });

  describe('special case where a single pcv deposit is compromised', async () => {
    throw new Error('Method not yet implemented.');
  });

  describe('special case where multiple pcv deposits are compromised', async () => {
    throw new Error('Method not yet implemented');
  });

  describe('special case where withdrawn balance is higher than expected', async () => {
    throw new Error('Method not yet implemented');
  });

  describe('special case where withdrawn balance is lower than expected', async () => {
    throw new Error('Method not yet implemented.');
  });

  describe('when a pcv deposit is compromised and over-reporting its balance', async () => {
    throw new Error('Method not yet implemented.');
  });

  describe('when a pcv deposit is compromised and under-reporting its balance', async () => {
    throw new Error('Method not yet implemented.');
  });
});
