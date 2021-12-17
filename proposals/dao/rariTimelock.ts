import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  MainnetContracts,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

chai.use(CBN(ethers.BigNumber));

/*
Rari Exchanger Timelocks

DEPLOY ACTIONS:

1. Deploy QuadraticTimelockedDelegator
2. Deploy QuadtraticTimelockedSubdelegator
3. Deploy ExchangerTimelock x2

*/

const delegatorBeneficiary = '0xeAd815D7faD76bf587EBbC27CE3c0212c3B256Be';
const subdelegatorBeneficiary = '0x4bFa2625D50b68D622D1e71c82ba6Db99BA0d17F';

const FIVE_YEARS = '157680000';
const TIMELOCK_START = '1603202400'; // Rari vesting start Tuesday, October 20, 2020 2:00:00 PM GMT

const toBN = ethers.BigNumber.from;

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { pegExchanger, tribe } = addresses;

  if (!pegExchanger || !tribe) {
    throw new Error('a contract address variable is not set');
  }
  const timelockFactory = await ethers.getContractFactory('QuadraticTimelockedDelegator');
  const subdelegatorFactory = await ethers.getContractFactory('QuadtraticTimelockedSubdelegator');
  const exchangerFactory = await ethers.getContractFactory('ExchangerTimelock');

  // 1. QuadraticTimelockedDelegator
  const rariQuadraticTimelock = await timelockFactory.deploy(
    tribe,
    delegatorBeneficiary,
    FIVE_YEARS,
    0, // no cliff
    ethers.constants.AddressZero, // no clawback admin
    TIMELOCK_START
  );
  await rariQuadraticTimelock.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock: ', rariQuadraticTimelock.address);

  // 2. QuadtraticTimelockedSubdelegator
  const rariQuadraticSubdelegatorTimelock = await subdelegatorFactory.deploy(
    subdelegatorBeneficiary,
    FIVE_YEARS,
    tribe,
    0, // no cliff
    addresses.feiDAOTimelock, // clawback admin is the DAO
    TIMELOCK_START
  );
  await rariQuadraticSubdelegatorTimelock.deployTransaction.wait();

  logging && console.log('rariQuadraticSubdelegatorTimelock: ', rariQuadraticSubdelegatorTimelock.address);

  // 3. Deploy ExchangerTimelock x2
  const exchangerTimelock1 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock.address);

  await exchangerTimelock1.deployTransaction.wait();

  logging && console.log('exchangerTimelock1: ', exchangerTimelock1.address);

  const exchangerTimelock2 = await exchangerFactory.deploy(pegExchanger, rariQuadraticSubdelegatorTimelock.address);

  await exchangerTimelock2.deployTransaction.wait();

  logging && console.log('exchangerTimelock2: ', exchangerTimelock2.address);

  return {
    rariQuadraticTimelock,
    rariQuadraticSubdelegatorTimelock,
    exchangerTimelock1,
    exchangerTimelock2
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // Excpect quadratic timelocks initialized correctly
  expect(await contracts.rariQuadraticTimelock.startTime()).to.be.bignumber.equal(toBN(TIMELOCK_START));
  expect(await contracts.rariQuadraticSubdelegatorTimelock.startTime()).to.be.bignumber.equal(toBN(TIMELOCK_START));
};
