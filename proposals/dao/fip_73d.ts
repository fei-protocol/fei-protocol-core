import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

const fipNumber = '73b';

/*
FIP-73b:

OA Steps:
1. Withdraw BentoBox FEI

*/

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  return {};
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Balance Before:');
  logging && console.log(await contracts.fei.balanceOf(addresses.optimisticTimelock));
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log(`Teardown:`);
  logging && console.log(await contracts.fei.balanceOf(addresses.optimisticTimelock));
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Validate:');
  expect(await contracts.bentoBox.balanceOf(addresses.fei, addresses.optimisticTimelock)).to.be.equal(0);
};

export { deploy, setup, teardown, validate };
