import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Core, Tribe, TribeMinter, TribeReserveStabilizer } from '@custom-types/contracts';

chai.use(CBN(ethers.BigNumber));

const TRIBE_INFLATION_BPS = 10000;

const ONE_IN_BPS = 10000;

const OSM_DURATION = 60 * 60 * 24; // 24h

/*
Backstop
DEPLOY ACTIONS:

1. Deploy TribeMinter
2. Deploy TribeReserveStabilizer

DAO ACTIONS:
1. Create TRIBE_MINTER_ADMIN Role
2. Set TribeMinter Contract Admin Role
3. Grant TribeReserveStabilizer Admin Role
4. Grant TRIBE_MINTER the Tribe Minter role
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, feiDAOTimelock, erc20Dripper, tribeUsdCompositeOracle, collateralizationOracleWrapper } = addresses;

  if (!core) {
    throw new Error('An environment variable contract address is not set');
  }

  // 1. Deploy Tribe Minter
  const tribeMinterFactory = await ethers.getContractFactory('TribeMinter');
  const tribeMinter = await tribeMinterFactory.deploy(core, TRIBE_INFLATION_BPS, feiDAOTimelock, core, erc20Dripper);

  await tribeMinter.deployTransaction.wait();

  logging && console.log('tribeMinter: ', tribeMinter.address);

  // 2. Deploy TribeReserveStabilizer
  const stabilizerFactory = await ethers.getContractFactory('TribeReserveStabilizer');
  const tribeReserveStabilizer = await stabilizerFactory.deploy(
    core,
    tribeUsdCompositeOracle,
    ethers.constants.AddressZero,
    ONE_IN_BPS, // $1 Exchange
    collateralizationOracleWrapper,
    ONE_IN_BPS, // 100% CR threshold
    tribeMinter.address,
    OSM_DURATION
  );

  await tribeReserveStabilizer.deployTransaction.wait();

  logging && console.log('tribeReserveStabilizer: ', tribeReserveStabilizer.address);
  return {
    tribeMinter,
    tribeReserveStabilizer
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const role = ethers.utils.id('TRIBE_MINTER_ROLE');
  const core: Core = contracts.core as Core;
  const tribe: Tribe = contracts.tribe as Tribe;
  const tribeMinter: TribeMinter = contracts.tribeMinter as TribeMinter;
  const tribeReserveStabilizer: TribeReserveStabilizer = contracts.tribeReserveStabilizer as TribeReserveStabilizer;

  expect(await core.hasRole(role, tribeReserveStabilizer.address)).to.be.true;
  expect(await tribe.minter()).to.be.equal(tribeMinter.address);
  expect(await tribeMinter.isContractAdmin(tribeReserveStabilizer.address)).to.be.true;
};
