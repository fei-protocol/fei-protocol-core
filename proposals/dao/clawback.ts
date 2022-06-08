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

/*

Clawback


*/

const fipNumber = 'clawback';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploying new Rari infra vesting contracts because the clawback admins are incorrect
  // 1. Deploy new Rari infra vesting contract
  const LinearTimelockedDelegatorFactory = await ethers.getContractFactory('LinearTimelockedDelegator');
  const newRariInfraFeiTimelock = await LinearTimelockedDelegatorFactory.deploy(
    addresses.fuseMultisig, // beneficiary
    0, // duration, TODO
    addresses.fei, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.feiDAOTimelock, // clawbackAdmin
    0 // startTime
  );
  await newRariInfraFeiTimelock.deployTransaction.wait();

  logging && console.log('New Rari infra FEI timelock deployed to: ', newRariInfraFeiTimelock.address);

  const newRariInfraTribeTimelock = await LinearTimelockedDelegatorFactory.deploy(
    addresses.fuseMultisig, // beneficiary
    0, // duration, TODO
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
  console.log(`No actions to complete in setup for fip${fipNumber}`);
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

  // 1. Lipstone beneficiary set to the DAO timelock
  expect(await lipstoneVesting.beneficiary()).to.be.equal(await addresses.feiDAOTimelock);

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

  // 4. Beneficiary accepted on Rari's FEI and TRIBE contracts

  // 3. Minted Fei and TRIBE on new contracts

  // 4. Clawback vesting contracts
  // TODO: Validate DAO receives it's funds
};

export { deploy, setup, teardown, validate };
