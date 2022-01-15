import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../../types/types';

chai.use(CBN(ethers.BigNumber));

/*
Permanently Revoke Burner

DEPLOY ACTIONS:

1. Deploy RestrictedPermissions
2. 

DAO ACTIONS:
1. setCore on Fei to restrictedPermissions

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, guardian, optimisticMultisig, ethPSM, daiPSM, tribe, fei, feiDAO } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1.
  const factory = await ethers.getContractFactory('RestrictedPermissions');
  const restrictedPermissions = await factory.deploy(core);

  await restrictedPermissions.deployed();

  logging && console.log('restrictedPermissions: ', restrictedPermissions.address);

  // 2.
  const optimisticFactory = await ethers.getContractFactory('OptimisticTimelock');
  const opsOptimisticTimelock = await optimisticFactory.deploy(
    core,
    60 * 60 * 24,
    [guardian, optimisticMultisig],
    [guardian, optimisticMultisig]
  );

  await opsOptimisticTimelock.deployed();

  logging && console.log('opsOptimisticTimelock: ', opsOptimisticTimelock.address);

  // 3.
  const skimmerFactory = await ethers.getContractFactory('FeiSkimmer');
  const ethPSMFeiSkimmer = await skimmerFactory.deploy(core, ethPSM, ethers.constants.WeiPerEther.mul(10_000_000));

  await ethPSMFeiSkimmer.deployed();

  logging && console.log('ethPSMFeiSkimmer: ', ethPSMFeiSkimmer.address);

  // 4.
  const daiPSMFeiSkimmer = await skimmerFactory.deploy(core, daiPSM, ethers.constants.WeiPerEther.mul(10_000_000));

  await daiPSMFeiSkimmer.deployed();

  logging && console.log('daiPSMFeiSkimmer: ', daiPSMFeiSkimmer.address);

  const TWO_YEARS = 60 * 60 * 24 * 365 * 2;

  // 3.
  const timelockFactory = await ethers.getContractFactory('LinearTokenTimelock');
  const rariInfraFeiTimelock = await timelockFactory.deploy(guardian, TWO_YEARS, fei, 0, feiDAO, 0);

  await rariInfraFeiTimelock.deployed();

  logging && console.log('rariInfraFeiTimelock: ', rariInfraFeiTimelock.address);

  // 4.
  const timelockedDelegatorFactory = await ethers.getContractFactory('LinearTimelockedDelegator');
  const rariInfraTribeTimelock = await timelockedDelegatorFactory.deploy(guardian, TWO_YEARS, tribe, 0, feiDAO, 0);

  await rariInfraTribeTimelock.deployed();

  logging && console.log('rariInfraTribeTimelock: ', rariInfraTribeTimelock.address);

  return {
    restrictedPermissions,
    opsOptimisticTimelock,
    ethPSMFeiSkimmer,
    daiPSMFeiSkimmer,
    rariInfraFeiTimelock,
    rariInfraTribeTimelock
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { fei, tribe, core, restrictedPermissions, votiumBriberD3pool } = contracts;

  expect(await fei.core()).to.be.equal(restrictedPermissions.address);
  expect(await restrictedPermissions.core()).to.be.equal(core.address);

  expect(await restrictedPermissions.isGovernor(core.address)).to.be.false;

  expect(await votiumBriberD3pool.isContractAdmin(addresses.opsOptimisticTimelock)).to.be.true;

  const FOUR_MIL = ethers.constants.WeiPerEther.mul(4_000_000);
  expect(await fei.balanceOf(addresses.rariInfraFeiTimelock)).to.be.equal(FOUR_MIL);
  expect(await tribe.balanceOf(addresses.rariInfraTribeTimelock)).to.be.equal(FOUR_MIL);
};
