import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { LinearTimelockedDelegator, QuadraticTimelockedDelegator } from '@custom-types/contracts';
import { BigNumber } from 'ethers';

/*
Clawback
*/

const fipNumber = 'clawback';

const OLD_RARI_TIMELOCK_FEI_AMOUNT = '3254306506849315068493151';
const OLD_RARI_TIMELOCK_TRIBE_AMOUNT = '3254296867072552004058854';

let minimumClawedTribe: BigNumber;
let initialDAOTribeBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const rariInfraFeiTimelock = await ethers.getContractAt('LinearTimelockedDelegator', addresses.rariInfraFeiTimelock);
  const rariInfraTribeTimelock = await ethers.getContractAt(
    'LinearTimelockedDelegator',
    addresses.rariInfraTribeTimelock
  );

  const rariFeiTimelockRemainingTime = await rariInfraFeiTimelock.remainingTime();
  const rariTribeTimelockRemainingTime = await rariInfraTribeTimelock.remainingTime();

  // Deploying new Rari infra vesting contracts because the clawback admins are incorrect
  // 1. Deploy new Rari infra vesting contract
  const LinearTimelockedDelegatorFactory = await ethers.getContractFactory('LinearTimelockedDelegator');
  const newRariInfraFeiTimelock = await LinearTimelockedDelegatorFactory.deploy(
    addresses.fuseMultisig, // beneficiary
    rariFeiTimelockRemainingTime, // duration, TODO - check this gives expected gradient
    addresses.fei, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.feiDAOTimelock, // clawbackAdmin
    0 // startTime
  );
  await newRariInfraFeiTimelock.deployTransaction.wait();

  logging && console.log('New Rari infra FEI timelock deployed to: ', newRariInfraFeiTimelock.address);

  const newRariInfraTribeTimelock = await LinearTimelockedDelegatorFactory.deploy(
    addresses.fuseMultisig, // beneficiary
    rariTribeTimelockRemainingTime, // duration, TODO - check this gives expected gradient
    addresses.tribe, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.feiDAOTimelock, // clawbackAdmin
    0 // startTime
  );
  await newRariInfraFeiTimelock.deployTransaction.wait();
  logging && console.log('New Rari infra TRIBE timelock deployed to: ', newRariInfraFeiTimelock.address);

  return {
    newRariInfraFeiTimelock,
    newRariInfraTribeTimelock
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const clawbackVestingContractA = contracts.clawbackVestingContractA as QuadraticTimelockedDelegator;
  const clawbackVestingContractB = contracts.clawbackVestingContractB as QuadraticTimelockedDelegator;
  const clawbackVestingContractC = contracts.clawbackVestingContractC as QuadraticTimelockedDelegator;

  expect(await contracts.fei.balanceOf(addresses.rariInfraFeiTimelock)).to.equal(OLD_RARI_TIMELOCK_FEI_AMOUNT);
  expect(await contracts.tribe.balanceOf(addresses.rariInfraTribeTimelock)).to.equal(OLD_RARI_TIMELOCK_TRIBE_AMOUNT);

  initialDAOTribeBalance = await contracts.tribe.balanceOf(addresses.feiDAOTimelock);

  const clawbackATribe = (await clawbackVestingContractA.totalToken()).sub(
    await clawbackVestingContractA.availableForRelease()
  );

  const clawbackBTribe = (await clawbackVestingContractB.totalToken()).sub(
    await clawbackVestingContractB.availableForRelease()
  );

  const clawbackCTribe = (await clawbackVestingContractC.totalToken()).sub(
    await clawbackVestingContractC.availableForRelease()
  );

  minimumClawedTribe = clawbackATribe.add(clawbackBTribe).add(clawbackCTribe);
  console.log('Minimum clawed tribe: ', minimumClawedTribe);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const lipstoneVesting = contracts.lipstoneVesting as QuadraticTimelockedDelegator;

  const rariInfraFeiTimelock = contracts.rariInfraFeiTimelock as LinearTimelockedDelegator;
  const rariInfraTribeTimelock = contracts.rariInfraTribeTimelock as LinearTimelockedDelegator;

  const newRariInfraFeiTimelock = contracts.newRariInfraFeiTimelock as LinearTimelockedDelegator;
  const newRariInfraTribeTimelock = contracts.newRariInfraTribeTimelock as LinearTimelockedDelegator;

  const clawbackVestingContractA = contracts.clawbackVestingContractA as QuadraticTimelockedDelegator;
  const clawbackVestingContractB = contracts.clawbackVestingContractB as QuadraticTimelockedDelegator;
  const clawbackVestingContractC = contracts.clawbackVestingContractC as QuadraticTimelockedDelegator;

  const fei = contracts.fei;
  const tribe = contracts.tribe;

  // 1. Lipstone beneficiary set to the DAO timelock
  expect(await lipstoneVesting.beneficiary()).to.be.equal(addresses.feiDAOTimelock);

  // 2. Existing Rari infra timelocks beneficiary set to the DAO timelock - DAO can now pull these funds in the future
  expect(await rariInfraFeiTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);
  expect(await rariInfraTribeTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);

  // 3. New Rari infra timelocks configured correctly
  // Fei
  expect(await newRariInfraFeiTimelock.beneficiary()).to.be.equal(addresses.fuseMultisig);
  expect(await newRariInfraFeiTimelock.clawbackAdmin()).to.be.equal(addresses.feiDAOTimelock);
  expect(await newRariInfraFeiTimelock.lockedToken()).to.be.equal(addresses.fei);

  // Tribe
  expect(await newRariInfraTribeTimelock.beneficiary()).to.be.equal(addresses.fuseMultisig);
  expect(await newRariInfraTribeTimelock.clawbackAdmin()).to.be.equal(addresses.feiDAOTimelock);
  expect(await newRariInfraTribeTimelock.lockedToken()).to.be.equal(addresses.tribe);

  // 4. Minted Fei and TRIBE on new contracts
  expect(await fei.balanceOf(newRariInfraFeiTimelock.address)).to.be.equal(OLD_RARI_TIMELOCK_FEI_AMOUNT);
  expect(await tribe.balanceOf(newRariInfraTribeTimelock.address)).to.be.equal(OLD_RARI_TIMELOCK_TRIBE_AMOUNT);

  // 4. Clawback vesting contracts
  // Verify clawbacks have no tokens left
  expect(await tribe.balanceOf(clawbackVestingContractA.address)).to.be.equal(0);
  expect(await tribe.balanceOf(clawbackVestingContractB.address)).to.be.equal(0);
  expect(await tribe.balanceOf(clawbackVestingContractC.address)).to.be.equal(0);

  // Verify DAO received it's TRIBE
  expect(await tribe.balanceOf(addresses.feiDAOTimelock)).to.be.bignumber.at.least(
    initialDAOTribeBalance.add(minimumClawedTribe)
  );
};

export { deploy, setup, teardown, validate };
