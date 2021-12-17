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

1-4. Deploy QuadraticTimelockedDelegator x 4
5-8. Deploy ExchangerTimelock x 4

*/

const delegatorBeneficiary = '0xeAd815D7faD76bf587EBbC27CE3c0212c3B256Be';
const delegatorBeneficiary2 = '0x4bFa2625D50b68D622D1e71c82ba6Db99BA0d17F'; // benficiary 2 controls 3 timelocks

const FIVE_YEARS = '157680000';
const TIMELOCK_START = '1603202400'; // Rari vesting start Tuesday, October 20, 2020 2:00:00 PM GMT

const toBN = ethers.BigNumber.from;

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { pegExchanger, tribe } = addresses;

  if (!pegExchanger || !tribe) {
    throw new Error('a contract address variable is not set');
  }
  const timelockFactory = await ethers.getContractFactory('QuadraticTimelockedDelegator');
  const exchangerFactory = await ethers.getContractFactory('ExchangerTimelock');

  // 1. QuadraticTimelockedDelegator
  const rariQuadraticTimelock = await timelockFactory.deploy(
    delegatorBeneficiary,
    FIVE_YEARS,
    tribe,
    0, // no cliff
    ethers.constants.AddressZero, // no clawback admin
    TIMELOCK_START
  );
  await rariQuadraticTimelock.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock: ', rariQuadraticTimelock.address);

  // 2. QuadraticTimelockedDelegator
  const rariQuadraticTimelock2 = await timelockFactory.deploy(
    delegatorBeneficiary2,
    FIVE_YEARS,
    tribe,
    0, // no cliff
    addresses.feiDAOTimelock, // clawback admin is the DAO
    0 // start upon deploy
  );
  await rariQuadraticTimelock2.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock2: ', rariQuadraticTimelock2.address);

  // 3. QuadraticTimelockedDelegator
  const rariQuadraticTimelock3 = await timelockFactory.deploy(
    delegatorBeneficiary2,
    FIVE_YEARS,
    tribe,
    0, // no cliff
    addresses.feiDAOTimelock, // clawback admin is the DAO
    0 // start upon deploy
  );
  await rariQuadraticTimelock3.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock3: ', rariQuadraticTimelock3.address);

  // 4. QuadraticTimelockedDelegator
  const rariQuadraticTimelock4 = await timelockFactory.deploy(
    delegatorBeneficiary2,
    FIVE_YEARS,
    tribe,
    0, // no cliff
    addresses.feiDAOTimelock, // clawback admin is the DAO
    0 // start upon deploy
  );
  await rariQuadraticTimelock4.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock4: ', rariQuadraticTimelock4.address);

  // 5. Deploy ExchangerTimelock x4
  const exchangerTimelock1 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock.address);

  await exchangerTimelock1.deployTransaction.wait();

  logging && console.log('exchangerTimelock1: ', exchangerTimelock1.address);

  const exchangerTimelock2 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock2.address);

  await exchangerTimelock2.deployTransaction.wait();

  logging && console.log('exchangerTimelock2: ', exchangerTimelock2.address);

  const exchangerTimelock3 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock3.address);

  await exchangerTimelock3.deployTransaction.wait();

  logging && console.log('exchangerTimelock3: ', exchangerTimelock3.address);

  const exchangerTimelock4 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock4.address);

  await exchangerTimelock4.deployTransaction.wait();

  logging && console.log('exchangerTimelock4: ', exchangerTimelock4.address);
  return {
    rariQuadraticTimelock,
    rariQuadraticTimelock2,
    rariQuadraticTimelock3,
    rariQuadraticTimelock4,
    exchangerTimelock1,
    exchangerTimelock2,
    exchangerTimelock3,
    exchangerTimelock4
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
