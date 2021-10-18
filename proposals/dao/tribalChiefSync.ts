import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { AutoRewardsDistributor, OptimisticTimelock, TribalChief } from '@custom-types/contracts';
import { TribalChiefSync } from '@custom-types/contracts/TribalChiefSync';
import { increaseTime } from '@test/helpers';

const blockReward = '71250000000000000000';

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const { tribalChief, autoRewardsDistributor, optimisticTimelock } = addresses;

  const factory = await ethers.getContractFactory('TribalChiefSync');
  const tribalChiefSync = await factory.deploy(tribalChief, autoRewardsDistributor, optimisticTimelock);
  await tribalChiefSync.deployTransaction.wait();

  logging && console.log('tribalChiefSync: ', tribalChiefSync.address);

  return {
    tribalChiefSync
  };
};

const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const timelock: OptimisticTimelock = contracts.optimisticTimelock as OptimisticTimelock;

  logging && console.log('Becoming OA admin');
  await timelock.becomeAdmin();
  logging && console.log('Granting EXECUTOR role');
  await timelock.grantRole(await timelock.EXECUTOR_ROLE(), addresses.tribalChiefSync);

  logging && console.log('Fast Forward');
  await increaseTime(100_000);
};

const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const tribalChiefSync: TribalChiefSync = contracts.tribalChiefSync as TribalChiefSync;

  const salt = '0xb9fbc6f9768742c095623adb6da7ad118bef79f893487a93d3659b4635ae1cf8';

  logging && console.log('Decrease rewards');
  await tribalChiefSync.decreaseRewards(blockReward, salt);
};

const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const tribalChief: TribalChief = contracts.tribalChief as TribalChief;
  const autoRewardsDistributor: AutoRewardsDistributor = contracts.autoRewardsDistributor as AutoRewardsDistributor;

  logging && console.log('Validating tribePerBlock and rewardSpeed');
  expect(await tribalChief.tribePerBlock()).to.be.bignumber.equal(ethers.BigNumber.from(blockReward));
  expect((await autoRewardsDistributor.getNewRewardSpeed())[1]).to.be.false;
};

export { deploy, setup, teardown, validate };
