import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

DAO Proposal #9001

Description:

Steps:
  1 -
  2 -
  3 -

*/

const fipNumber = '9001'; // Change me!

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy VotiumBriber for d3pool
  const votiumBriberFactory = await ethers.getContractFactory('VotiumBriber');
  const votiumBriberD3pool = await votiumBriberFactory.deploy(addresses.core, addresses.tribe, addresses.votiumBribe);
  await votiumBriberD3pool.deployTransaction.wait();
  logging && console.log('votiumBriberD3pool :', votiumBriberD3pool.address);

  // Deploy StakingTokenWrapper for votiumBriberD3pool
  const stakingTokenWrapperFactory = await ethers.getContractFactory('StakingTokenWrapper');
  const stakingTokenWrapperBribeD3pool = await stakingTokenWrapperFactory.deploy(
    addresses.tribalChief,
    votiumBriberD3pool.address
  );
  await stakingTokenWrapperBribeD3pool.deployTransaction.wait();
  logging && console.log('stakingTokenWrapperBribeD3pool :', stakingTokenWrapperBribeD3pool.address);

  return {
    votiumBriberD3pool,
    stakingTokenWrapperBribeD3pool
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  await contracts.tribalChief.add('250', addresses.stakingTokenWrapperBribeD3pool, ethers.constants.AddressZero, [
    [0, 10000]
  ]);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Init the STW for d3pool bribes after the pool has been added on TribalChief
  const poolId = (await contracts.tribalChief.numPools()).sub(1);
  await contracts.stakingTokenWrapperBribeD3pool.init(poolId);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  expect(await contracts.tribe.balanceOf(addresses.votiumBriberD3pool)).to.be.equal('0');
  await contracts.stakingTokenWrapperBribeD3pool.harvest();
  expect(await contracts.tribe.balanceOf(addresses.votiumBriberD3pool)).to.be.at.least('0');

  const stakingTokenWrapperBribeD3poolPid = await contracts.stakingTokenWrapperBribeD3pool.pid();
  expect(await contracts.tribalChief.stakedToken(stakingTokenWrapperBribeD3poolPid)).to.be.equal(
    addresses.stakingTokenWrapperBribeD3pool
  );
  expect((await contracts.tribalChief.poolInfo(stakingTokenWrapperBribeD3poolPid)).allocPoint).to.be.equal('250');
};

export { deploy, setup, teardown, validate };
