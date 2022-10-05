import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

TIP_123

*/

const fipNumber = 'tip_123';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // 1. Deploy DAOTimelockBurner, to burn admin of Fei and Rari DAO timelocks
  const DAOTimelockBurnerFactory = await ethers.getContractFactory('DAOTimelockBurner');
  const daoTimelockBurner = await DAOTimelockBurnerFactory.deploy();
  console.log('DAO timelock burner deployed to: ', daoTimelockBurner.address);

  const FeiTimelockBurnerFactory = await ethers.getContractFactory('FeiLinearTokenTimelockBurner');
  // 2. Deploy deprecated Rari FEI timelock burner
  const deprecatedRariFeiTimelockBurner = await FeiTimelockBurnerFactory.deploy(addresses.rariInfraFeiTimelock);
  console.log('Deprecated Rari FEI timelock burner deployed to: ', deprecatedRariFeiTimelockBurner.address);

  // 3. Deploy TribeTimelockedDelegatorBurner
  const TribeTimelockedDelegatorBurnerFactory = await ethers.getContractFactory('TribeTimelockedDelegatorBurner');
  const deprecatedRariTribeTimelockBurner = await TribeTimelockedDelegatorBurnerFactory.deploy(
    addresses.rariInfraTribeTimelock
  );
  console.log('Deprecated Rari TRIBE timelock burned deployed to: ', deprecatedRariTribeTimelockBurner.address);

  return {
    daoTimelockBurner,
    deprecatedRariFeiTimelockBurner,
    deprecatedRariTribeTimelockBurner
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Verify Fei DAO timelock admin burned

  // 2. Verify 
};

export { deploy, setup, teardown, validate };
