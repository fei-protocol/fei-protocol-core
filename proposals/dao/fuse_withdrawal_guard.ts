import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { ethers } from 'hardhat';
import { expect } from 'chai';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses, logging = false) => {
  const {
    core,
    fei,
    lusd,
    dai,
    rariPool8FeiPCVDeposit,
    rariPool8DaiPCVDeposit,
    rariPool8LusdPCVDeposit,
    rariPool79FeiPCVDeposit,
    rariPool128FeiPCVDeposit,
    rariPool22FeiPCVDeposit,
    rariPool24FeiPCVDeposit,
    rariPool18FeiPCVDeposit,
    rariPool6FeiPCVDeposit,
    lusdPSM,
    daiFixedPricePSM
  } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  const factory = await ethers.getContractFactory('FuseWithdrawalGuard');
  const fuseWithdrawalGuard = await factory.deploy(
    core,
    [
      rariPool8FeiPCVDeposit,
      rariPool8DaiPCVDeposit,
      rariPool8LusdPCVDeposit,
      rariPool79FeiPCVDeposit,
      rariPool128FeiPCVDeposit,
      rariPool22FeiPCVDeposit,
      rariPool24FeiPCVDeposit,
      rariPool18FeiPCVDeposit,
      rariPool6FeiPCVDeposit
    ],
    [
      daiFixedPricePSM,
      daiFixedPricePSM,
      lusdPSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM,
      daiFixedPricePSM
    ],
    [fei, dai, lusd, fei, fei, fei, fei, fei, fei],
    [0, 0, 0, 0, 0, 0, 0, 0, 0]
  );

  logging && console.log('FuseWithdrawalGuard deployed to: ', fuseWithdrawalGuard.address);

  return { fuseWithdrawalGuard };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in validate`);
};

export { deploy, setup, teardown, validate };
