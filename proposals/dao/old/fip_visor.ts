import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  return {};
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { fei, usdc } = contracts;
  console.log(await fei.balanceOf(addresses.optimisticTimelock));
  console.log(await usdc.balanceOf(addresses.optimisticTimelock));
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const { fei, usdc } = contracts;
  console.log(await fei.balanceOf(addresses.optimisticTimelock));
  console.log(await usdc.balanceOf(addresses.optimisticTimelock));
};

export { deploy, setup, teardown, validate };
