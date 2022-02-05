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
FIP-77:

OA Steps:
1. Set rewards for fei-3crv on FeiRari to 1000
2. Set rewards for fei-3crv on TribalChief to 0
3. Set fei-3crv supply cap to 250m

*/

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  return {};
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Setup');
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log(`No Teardown`);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Validate:');
};

export { deploy, setup, teardown, validate };
