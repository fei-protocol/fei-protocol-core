import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '../../../types/types';
import { FeiDAO, ProxyAdmin, Timelock } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

/*
DAO ACTIONS:
1. Transfer ownership of the ProxyAdmin from the oldTimelock to the newTimelock
2. Set the delay on the oldTimelock to 0
3. Set the pending admin on the oldTimelock to be the newTimelock. Will later need accepting by newTimelock
4. Set the timelock on the FEI DAO back to the newTimelock
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
  const feiDAO: FeiDAO = contracts.feiDAO as FeiDAO;
  const proxyAdmin: ProxyAdmin = contracts.proxyAdmin as ProxyAdmin;
  const oldTimelock: Timelock = contracts.timelock as Timelock;
  const newTimelockAddress = addresses.feiDAOTimelock;

  expect(await proxyAdmin.owner()).to.be.equal(newTimelockAddress);
  expect(await oldTimelock.delay()).to.be.equal(0);
  expect(await oldTimelock.pendingAdmin()).to.be.equal(newTimelockAddress);
  expect(await feiDAO.timelock()).to.be.equal(newTimelockAddress);
};
