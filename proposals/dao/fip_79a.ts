import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../types/types';
import { Core, FeiDAO } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

/*
DAO ACTIONS:
1. Grant Governor role to Rari DAO
2. Change the DAO timelock from the newTimelock to the oldTimelock
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
  const governorRole = ethers.utils.id('GOVERN_ROLE');
  const core: Core = contracts.core as Core;

  // 1. Validate that Rari timelock has governor role
  expect(await core.hasRole(governorRole, addresses.rariTimelock)).to.be.true;

  // 2. Validate that Fei DAO timelock has been changed to oldTimelock
  const feiDAO: FeiDAO = contracts.feiDAO as FeiDAO;
  expect(await feiDAO.timelock()).to.be.equal(addresses.timelock);
};
