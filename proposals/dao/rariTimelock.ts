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

1. Deploy QuadraticTimelockedDelegator
2. Deploy QuadtraticTimelockedSubdelegator
3. Deploy ExchangerTimelock x2

*/

const delegatorBeneficiary = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775'; // TODO change to actual Rari addresses
const subdelegatorBeneficiary = '0xB8f482539F2d3Ae2C9ea6076894df36D1f632775'; // TODO change to actual Rari addresses

const FIVE_YEARS = '157680000';
const TIMELOCK_START = '1630000000'; // TODO set to Rari vesting start

const toBN = ethers.BigNumber.from;

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { pegExchanger, tribe } = addresses;

  if (!pegExchanger || !tribe) {
    throw new Error('An environment variable contract address is not set');
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
  logging && console.log('Setup');

  const rgt = contracts.rgt;

  const signer = await getImpersonatedSigner(addresses.rariTimelock);

  await rgt.connect(signer).transfer(addresses.exchangerTimelock1, ethers.constants.WeiPerEther);
  await rgt.connect(signer).transfer(addresses.exchangerTimelock2, ethers.constants.WeiPerEther.mul(toBN(2)));

  await contracts.exchangerTimelock1.exchangeToTimelock();
  await contracts.exchangerTimelock2.exchangeToTimelock();
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No Teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const tribe = contracts.tribe;

  expect(await contracts.rariQuadraticTimelock.startTime()).to.be.bignumber.equal(toBN(TIMELOCK_START));
  expect(await contracts.rariQuadraticSubdelegatorTimelock.startTime()).to.be.bignumber.equal(toBN(TIMELOCK_START));

  expect(await tribe.balanceOf(addresses.rariQuadraticTimelock)).to.be.bignumber.equal(toBN('26705673430000000000'));
  expect(await tribe.balanceOf(addresses.rariQuadraticSubdelegatorTimelock)).to.be.bignumber.equal(
    toBN('53411346860000000000')
  );
};
