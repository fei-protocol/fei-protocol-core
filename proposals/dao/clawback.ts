import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { LinearTimelockedDelegator, LinearTokenTimelock, QuadraticTimelockedDelegator } from '@custom-types/contracts';
import { BigNumber } from 'ethers';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*
Clawback
*/

const fipNumber = 'clawback';

// TODO: Update these based on the final balances
const OLD_RARI_TIMELOCK_FEI_AMOUNT = '3254306506849315068493151';
const OLD_RARI_TIMELOCK_TRIBE_AMOUNT = '3254296867072552004058854';

// Sanity check, minimum amount DAO should receive when clawing back
const MIN_CLAWED_TRIBE = ethers.constants.WeiPerEther.mul(3_000_000);

// Sanity check, minimum amount clawback vesting contract beneficiary should receive
const MIN_BENEFICIARY_CLAWED_TRIBE = ethers.constants.WeiPerEther.mul(1_000);

let initialDAOTribeBalance: BigNumber;
let initialClawbackBeneficiaryBalance: BigNumber;
let rariFeiTimelockRemainingDuration: BigNumber;
let rariTribeTimelockRemainingDuration: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const rariInfraFeiTimelock = await ethers.getContractAt('LinearTokenTimelock', addresses.rariInfraFeiTimelock);
  const rariInfraTribeTimelock = await ethers.getContractAt(
    'LinearTimelockedDelegator',
    addresses.rariInfraTribeTimelock
  );

  rariFeiTimelockRemainingDuration = await rariInfraFeiTimelock.remainingTime();
  rariTribeTimelockRemainingDuration = await rariInfraTribeTimelock.remainingTime();

  // 1. Deploy new Rari infra vesting contract
  const LinearTimelockedDelegatorFactory = await ethers.getContractFactory('LinearTimelockedDelegator'); // change timelock type
  const newRariInfraFeiTimelock = await LinearTimelockedDelegatorFactory.deploy(
    addresses.fuseMultisig, // beneficiary
    rariFeiTimelockRemainingDuration, // duration
    addresses.fei, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.feiDAOTimelock, // clawbackAdmin
    0 // startTime
  );
  await newRariInfraFeiTimelock.deployTransaction.wait();

  logging && console.log('New Rari infra FEI timelock deployed to: ', newRariInfraFeiTimelock.address);

  const newRariInfraTribeTimelock = await LinearTimelockedDelegatorFactory.deploy(
    addresses.fuseMultisig, // beneficiary
    rariTribeTimelockRemainingDuration, // duration
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
  const rariInfraFeiTimelock = contracts.rariInfraFeiTimelock as LinearTokenTimelock;
  const rariInfraTribeTimelock = contracts.rariInfraTribeTimelock as LinearTimelockedDelegator;

  initialDAOTribeBalance = await contracts.tribe.balanceOf(addresses.feiDAOTimelock);
  initialClawbackBeneficiaryBalance = await contracts.tribe.balanceOf(addresses.clawbackVestingContractBeneficiary);

  expect(await contracts.fei.balanceOf(addresses.rariInfraFeiTimelock)).to.equal(OLD_RARI_TIMELOCK_FEI_AMOUNT);
  expect(await contracts.tribe.balanceOf(addresses.rariInfraTribeTimelock)).to.equal(OLD_RARI_TIMELOCK_TRIBE_AMOUNT);

  // Set pending beneficiary on old RARI timelocks
  const rariInfraTimelockSigner = await getImpersonatedSigner(addresses.fuseMultisig);
  await forceEth(addresses.fuseMultisig);

  await rariInfraFeiTimelock.connect(rariInfraTimelockSigner).setPendingBeneficiary(addresses.feiDAOTimelock);
  await rariInfraTribeTimelock.connect(rariInfraTimelockSigner).setPendingBeneficiary(addresses.feiDAOTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const rariInfraFeiTimelock = contracts.rariInfraFeiTimelock as LinearTokenTimelock;
  const rariInfraTribeTimelock = contracts.rariInfraTribeTimelock as LinearTimelockedDelegator;

  const newRariInfraFeiTimelock = contracts.newRariInfraFeiTimelock as LinearTokenTimelock;
  const newRariInfraTribeTimelock = contracts.newRariInfraTribeTimelock as LinearTimelockedDelegator;

  const clawbackVestingContractA = contracts.clawbackVestingContractA as QuadraticTimelockedDelegator;
  const clawbackVestingContractB = contracts.clawbackVestingContractB as QuadraticTimelockedDelegator;
  const clawbackVestingContractC = contracts.clawbackVestingContractC as QuadraticTimelockedDelegator;

  const fei = contracts.fei;
  const tribe = contracts.tribe;

  // 1. Existing Rari infra timelocks beneficiary set to the DAO timelock - DAO can now pull these funds in the future
  expect(await rariInfraFeiTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);
  expect(await rariInfraTribeTimelock.beneficiary()).to.be.equal(addresses.feiDAOTimelock);

  // 2. New Rari infra timelocks configured correctly
  // Fei
  expect(await newRariInfraFeiTimelock.beneficiary()).to.be.equal(addresses.fuseMultisig);
  expect(await newRariInfraFeiTimelock.clawbackAdmin()).to.be.equal(addresses.feiDAOTimelock);
  expect(await newRariInfraFeiTimelock.lockedToken()).to.be.equal(addresses.fei);
  expect(await newRariInfraFeiTimelock.duration()).to.be.equal(rariFeiTimelockRemainingDuration);
  expect(await newRariInfraFeiTimelock.cliffSeconds()).to.be.equal(0);

  // Tribe
  expect(await newRariInfraTribeTimelock.beneficiary()).to.be.equal(addresses.fuseMultisig);
  expect(await newRariInfraTribeTimelock.clawbackAdmin()).to.be.equal(addresses.feiDAOTimelock);
  expect(await newRariInfraTribeTimelock.lockedToken()).to.be.equal(addresses.tribe);
  expect(await newRariInfraTribeTimelock.duration()).to.be.equal(rariTribeTimelockRemainingDuration);
  expect(await newRariInfraTribeTimelock.cliffSeconds()).to.be.equal(0);

  // 3. Minted Fei and TRIBE on new Rari contracts
  expect(await fei.balanceOf(newRariInfraFeiTimelock.address)).to.be.equal(OLD_RARI_TIMELOCK_FEI_AMOUNT);
  expect(await tribe.balanceOf(newRariInfraTribeTimelock.address)).to.be.equal(OLD_RARI_TIMELOCK_TRIBE_AMOUNT);

  // 4. Clawback vesting contracts
  // Verify clawbacks have no tokens left
  expect(await tribe.balanceOf(clawbackVestingContractA.address)).to.be.equal(0);
  expect(await tribe.balanceOf(clawbackVestingContractB.address)).to.be.equal(0);
  expect(await tribe.balanceOf(clawbackVestingContractC.address)).to.be.equal(0);

  const finalDAOTribeBalance = await tribe.balanceOf(addresses.feiDAOTimelock);
  const totalClawedTribe = finalDAOTribeBalance.sub(initialDAOTribeBalance);
  console.log('Clawed TRIBE: ', totalClawedTribe.toString());
  expect(totalClawedTribe).to.be.bignumber.at.least(MIN_CLAWED_TRIBE);

  // Verify clawbackVesting contracts, a multisig, received TRIBE
  const clawbackBeneficiaryBalance = await tribe.balanceOf(addresses.clawbackVestingContractBeneficiary);
  const clawbackBeneficiaryAmount = clawbackBeneficiaryBalance.sub(initialClawbackBeneficiaryBalance);
  console.log('Beneficiary clawed TRIBE: ', clawbackBeneficiaryAmount.toString());
  expect(clawbackBeneficiaryAmount).to.be.bignumber.at.least(MIN_BENEFICIARY_CLAWED_TRIBE);

  // Maybe fast forward and claim?
  const percentageVestedToJaiAndDavid = clawbackBeneficiaryAmount.div(totalClawedTribe).mul(100);
  console.log('% clawed back: ', percentageVestedToJaiAndDavid.toString());
};

export { deploy, setup, teardown, validate };
