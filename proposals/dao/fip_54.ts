import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../types/types';

chai.use(CBN(ethers.BigNumber));

/*
Permanently Revoke Burner

DEPLOY ACTIONS:

1. Deploy RestrictedPermissions

DAO ACTIONS:
1. setCore on Fei to restrictedPermissions

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1.
  const factory = await ethers.getContractFactory('RestrictedPermissions');
  const restrictedPermissions = await factory.deploy(core);

  await restrictedPermissions.deployTransaction.wait();

  logging && console.log('restrictedPermissions: ', restrictedPermissions.address);

  return {
    restrictedPermissions
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { fei, core, restrictedPermissions } = contracts;

  expect(await fei.core()).to.be.equal(restrictedPermissions.address);
  expect(await restrictedPermissions.core()).to.be.equal(core.address);

  expect(await restrictedPermissions.isGovernor(core.address)).to.be.false;
};
