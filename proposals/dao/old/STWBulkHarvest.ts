import { ethers } from 'hardhat';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

const fipNumber = 'STWBulkHarvest';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const factory = await ethers.getContractFactory('STWBulkHarvest');
  const stwBulkHarvest = await factory.deploy();
  await stwBulkHarvest.deployTransaction.wait();

  logging && console.log('stwBulkHarvest: ', stwBulkHarvest.address);

  return {
    stwBulkHarvest
  };
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for ${fipNumber}`);
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for ${fipNumber}`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in validate for ${fipNumber}`);
};

export { deploy, setup, teardown, validate };
