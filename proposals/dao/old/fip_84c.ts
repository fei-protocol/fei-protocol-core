import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../../types/types';
import { Timelock } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

/*
DAO ACTIONS:
1. On the oldTimelock, accept the newTimelock as the admin. Was previously set to pendingAdmin in fip_79b
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  logging && console.log('No deploy');
  return {};
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // 1. Validate newTimelock is admin of the oldTimelock
  const oldTimelock: Timelock = contracts.timelock as Timelock;
  const newTimelockAddress = addresses.feiDAOTimelock;
  expect(await oldTimelock.admin()).to.be.equal(newTimelockAddress);
};
