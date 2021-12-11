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
import { PCVGuardian } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

/*
PCV Guardian

DEPLOY ACTIONS:

1. Deploy PCV Guardian

DAO ACTIONS:
1. Grant PCV Guardian GUARDIAN_ROLE
2. Grant PCV Guardian PCV_CONTROLLER_ROLE

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, feiDAOTimelock, compoundEthPCVDeposit, ethReserveStabilizer, aaveEthPCVDeposit } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Deploy PCV Guardian
  const factory = await ethers.getContractFactory('PCVGuardian');
  const safeAddresses = [feiDAOTimelock, compoundEthPCVDeposit, ethReserveStabilizer, aaveEthPCVDeposit];
  const pcvGuardian = await factory.deploy(core, safeAddresses);

  await pcvGuardian.deployTransaction.wait();

  logging && console.log('pcvGuardian: ', pcvGuardian.address);

  return {
    pcvGuardian
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const pcvGuardian: PCVGuardian = contracts.pcvGuardian as PCVGuardian;

  const safeAddresses = await pcvGuardian.getSafeAddresses();
  expect(safeAddresses.length).to.be.equal(4);
};
