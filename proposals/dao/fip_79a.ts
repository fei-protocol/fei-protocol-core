import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import { FeiDAO } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

/*
DAO ACTIONS:
1. Transfer admin of all contracts for whose admin was the oldTimelock to the newTimelock
2. Revert the oldTimelock and make it's admin the newTimelock
3. 
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
  const feiDAO: FeiDAO = contracts.core as FeiDAO;

  expect(await feiDAO.timelock()).to.be.equal(addresses.timelock);
};
