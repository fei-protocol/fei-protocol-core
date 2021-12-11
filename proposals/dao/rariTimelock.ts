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
import { getImpersonatedSigner } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

/*
Rari Exchanger Timelocks

DEPLOY ACTIONS:

1. Deploy QuadraticTimelockedDelegator x 3
2. Deploy ExchangerTimelock x 3

*/

const beneficiary1 = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775'; // TODO change to actual Rari addresses
const FIVE_YEARS = 60 * 60 * 24 * 365 * 5;
const TIMELOCK_START = 1630000000; // TODO set to Rari vesting start

const toBN = ethers.BigNumber.from;

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { pegExchanger, tribe } = addresses;

  if (!pegExchanger || !tribe) {
    throw new Error('An environment variable contract address is not set');
  }
  const timelockFactory = await ethers.getContractFactory('QuadraticTimelockedDelegator');
  const exchangerFactory = await ethers.getContractFactory('ExchangerTimelock');

  // 1. Timelock 1
  const rariQuadraticTimelock1 = await timelockFactory.deploy(
    tribe,
    beneficiary1,
    FIVE_YEARS,
    0,
    ethers.constants.AddressZero,
    TIMELOCK_START
  );
  await rariQuadraticTimelock1.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock1: ', rariQuadraticTimelock1.address);

  // 2. Deploy ExchangerTimelock
  const exchangerTimelock1 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock1.address);

  await exchangerTimelock1.deployTransaction.wait();

  logging && console.log('exchangerTimelock1: ', exchangerTimelock1.address);

  // 3. Timelock 2
  const rariQuadraticTimelock2 = await timelockFactory.deploy(
    tribe,
    beneficiary1,
    FIVE_YEARS,
    0,
    ethers.constants.AddressZero,
    TIMELOCK_START
  );
  await rariQuadraticTimelock2.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock2: ', rariQuadraticTimelock2.address);

  // 4. Deploy ExchangerTimelock 2
  const exchangerTimelock2 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock2.address);

  await exchangerTimelock2.deployTransaction.wait();

  logging && console.log('exchangerTimelock2: ', exchangerTimelock2.address);

  // 5. Timelock 3
  const rariQuadraticTimelock3 = await timelockFactory.deploy(
    tribe,
    beneficiary1,
    FIVE_YEARS,
    0,
    ethers.constants.AddressZero,
    TIMELOCK_START
  );
  await rariQuadraticTimelock3.deployTransaction.wait();

  logging && console.log('rariQuadraticTimelock3: ', rariQuadraticTimelock3.address);

  // 6. Deploy ExchangerTimelock
  const exchangerTimelock3 = await exchangerFactory.deploy(pegExchanger, rariQuadraticTimelock3.address);

  await exchangerTimelock3.deployTransaction.wait();

  logging && console.log('exchangerTimelock3: ', exchangerTimelock3.address);

  return {
    rariQuadraticTimelock1,
    exchangerTimelock1,
    rariQuadraticTimelock2,
    exchangerTimelock2,
    rariQuadraticTimelock3,
    exchangerTimelock3
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('Setup');

  const rgt = contracts.rgt;

  const signer = await getImpersonatedSigner(addresses.rariTimelock);

  await rgt.connect(signer).transfer(addresses.exchangerTimelock1, ethers.constants.WeiPerEther);
  await rgt.connect(signer).transfer(addresses.exchangerTimelock2, ethers.constants.WeiPerEther.mul(toBN(2)));
  await rgt.connect(signer).transfer(addresses.exchangerTimelock3, ethers.constants.WeiPerEther.mul(toBN(3)));

  await contracts.exchangerTimelock1.exchangeToTimelock();
  await contracts.exchangerTimelock2.exchangeToTimelock();
  await contracts.exchangerTimelock3.exchangeToTimelock();
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const tribe = contracts.tribe;

  expect(await contracts.rariQuadraticTimelock1.startTime()).to.be.bignumber.equal(toBN(TIMELOCK_START));
  expect(await contracts.rariQuadraticTimelock2.startTime()).to.be.bignumber.equal(toBN(TIMELOCK_START));
  expect(await contracts.rariQuadraticTimelock3.startTime()).to.be.bignumber.equal(toBN(TIMELOCK_START));

  expect(await tribe.balanceOf(addresses.rariQuadraticTimelock1)).to.be.bignumber.equal(toBN('26705673430000000000'));
  expect(await tribe.balanceOf(addresses.rariQuadraticTimelock2)).to.be.bignumber.equal(toBN('53411346860000000000'));
  expect(await tribe.balanceOf(addresses.rariQuadraticTimelock3)).to.be.bignumber.equal(toBN('80117020290000000000'));
};
