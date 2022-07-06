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

const toBN = ethers.BigNumber.from;
/*
Migrate the Rari Infra timelocks and return the unvested Jai and David TRIBE tokens

Rari Infra timelocks
- There is a Fei and a TRIBE timelock
- Both active from Dec 2021
- Duration set was 63072000 seconds (730 days, 2 years)
- They release 2M FEI and 2M TRIBE per year
- Linear timelocks

Jai and David Vesting contracts
- 3 vesting contracts with the same terms
- Active from Dec 2021
- Quadratic back weighted 5 year vesting
- There is 17.1M TRIBE total across the 3 vesting contracts
- The beneficiary of each vesting contract is a Gnosis Safe multisig. Owners are unknown

*/

const fipNumber = 'FIP-113: End Departed Rari Founders Vesting of TRIBE';

const OLD_RARI_TIMELOCK_FEI_AMOUNT = '3178504756468797564687976';
const OLD_RARI_TIMELOCK_TRIBE_AMOUNT = '3178502219685438863521056';

// Sanity check, minimum amount DAO should receive when clawing back
const MIN_CLAWED_TRIBE = ethers.constants.WeiPerEther.mul(15_000_000);

// Sanity check, minimum amount clawback vesting contract beneficiary should receive
const MIN_BENEFICIARY_CLAWED_TRIBE = ethers.constants.WeiPerEther.mul(100_000);

let initialDAOTribeBalance: BigNumber;
let initialClawbackBeneficiaryBalance: BigNumber;

const RARI_FEI_TIMELOCK_REMAINING_DURATION = 50110581;
const RARI_TRIBE_TIMELOCK_REMAINING_DURATION = 50110608;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // const rariInfraFeiTimelock = await ethers.getContractAt('LinearTokenTimelock', addresses.rariInfraFeiTimelock);
  // const rariInfraTribeTimelock = await ethers.getContractAt(
  //   'LinearTimelockedDelegator',
  //   addresses.rariInfraTribeTimelock
  // );

  // rariFeiTimelockRemainingDuration = await rariInfraFeiTimelock.remainingTime();
  // rariTribeTimelockRemainingDuration = await rariInfraTribeTimelock.remainingTime();

  // 1. Deploy new Rari infra vesting contract
  const LinearTokenTimelockedFactory = await ethers.getContractFactory('LinearTokenTimelock'); // change timelock type
  const newRariInfraFeiTimelock = await LinearTokenTimelockedFactory.deploy(
    addresses.rariOpsMultisig, // beneficiary
    RARI_FEI_TIMELOCK_REMAINING_DURATION, // duration
    addresses.fei, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.tribalCouncilTimelock, // clawbackAdmin
    0 // startTime
  );
  await newRariInfraFeiTimelock.deployTransaction.wait();

  logging && console.log('New Rari infra FEI timelock deployed to: ', newRariInfraFeiTimelock.address);

  const LinearTokenTimelockedDelegatorFactory = await ethers.getContractFactory('LinearTimelockedDelegator');
  const newRariInfraTribeTimelock = await LinearTokenTimelockedDelegatorFactory.deploy(
    addresses.rariOpsMultisig, // beneficiary
    RARI_TRIBE_TIMELOCK_REMAINING_DURATION, // duration
    addresses.tribe, // token
    0, // secondsUntilCliff - have already passed the cliff
    addresses.tribalCouncilTimelock, // clawbackAdmin
    0 // startTime
  );
  await newRariInfraTribeTimelock.deployTransaction.wait();
  logging && console.log('New Rari infra TRIBE timelock deployed to: ', newRariInfraTribeTimelock.address);

  return {
    newRariInfraFeiTimelock,
    newRariInfraTribeTimelock
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  initialDAOTribeBalance = await contracts.tribe.balanceOf(addresses.feiDAOTimelock);
  initialClawbackBeneficiaryBalance = await contracts.tribe.balanceOf(addresses.clawbackVestingContractBeneficiary);

  expect(await contracts.fei.balanceOf(addresses.rariInfraFeiTimelock)).to.equal(OLD_RARI_TIMELOCK_FEI_AMOUNT);
  expect(await contracts.tribe.balanceOf(addresses.rariInfraTribeTimelock)).to.equal(OLD_RARI_TIMELOCK_TRIBE_AMOUNT);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const newRariInfraFeiTimelock = contracts.newRariInfraFeiTimelock as LinearTokenTimelock;
  const newRariInfraTribeTimelock = contracts.newRariInfraTribeTimelock as LinearTimelockedDelegator;

  const clawbackVestingContractA = contracts.clawbackVestingContractA as QuadraticTimelockedDelegator;
  const clawbackVestingContractB = contracts.clawbackVestingContractB as QuadraticTimelockedDelegator;
  const clawbackVestingContractC = contracts.clawbackVestingContractC as QuadraticTimelockedDelegator;

  const fei = contracts.fei;
  const tribe = contracts.tribe;

  // 1. New Rari infra timelocks configured correctly
  // Fei
  expect(await newRariInfraFeiTimelock.beneficiary()).to.be.equal(addresses.rariOpsMultisig);
  expect(await newRariInfraFeiTimelock.clawbackAdmin()).to.be.equal(addresses.tribalCouncilTimelock);
  expect(await newRariInfraFeiTimelock.lockedToken()).to.be.equal(addresses.fei);
  expect(await newRariInfraFeiTimelock.duration()).to.be.equal(RARI_FEI_TIMELOCK_REMAINING_DURATION);
  expect(await newRariInfraFeiTimelock.cliffSeconds()).to.be.equal(0);

  // Tribe
  expect(await newRariInfraTribeTimelock.beneficiary()).to.be.equal(addresses.rariOpsMultisig);
  expect(await newRariInfraTribeTimelock.clawbackAdmin()).to.be.equal(addresses.tribalCouncilTimelock);
  expect(await newRariInfraTribeTimelock.lockedToken()).to.be.equal(addresses.tribe);
  expect(await newRariInfraTribeTimelock.duration()).to.be.equal(RARI_TRIBE_TIMELOCK_REMAINING_DURATION);
  expect(await newRariInfraTribeTimelock.cliffSeconds()).to.be.equal(0);

  // 2. Minted Fei and TRIBE on new Rari contracts
  expect(await fei.balanceOf(newRariInfraFeiTimelock.address)).to.be.equal(OLD_RARI_TIMELOCK_FEI_AMOUNT);
  expect(await tribe.balanceOf(newRariInfraTribeTimelock.address)).to.be.equal(OLD_RARI_TIMELOCK_TRIBE_AMOUNT);

  // 3. Clawback vesting contracts
  // Verify clawbacks have no tokens left
  expect(await tribe.balanceOf(clawbackVestingContractA.address)).to.be.equal(0);
  expect(await tribe.balanceOf(clawbackVestingContractB.address)).to.be.equal(0);
  expect(await tribe.balanceOf(clawbackVestingContractC.address)).to.be.equal(0);

  const finalDAOTribeBalance = await tribe.balanceOf(addresses.feiDAOTimelock);
  const totalClawedTribe = finalDAOTribeBalance.sub(initialDAOTribeBalance);
  console.log('Clawed TRIBE: ', totalClawedTribe.toString());
  expect(totalClawedTribe).to.be.bignumber.at.least(MIN_CLAWED_TRIBE);

  // 4. Verify clawbackVesting contracts, a multisig, received TRIBE
  const clawbackBeneficiaryBalance = await tribe.balanceOf(addresses.clawbackVestingContractBeneficiary);
  const clawbackBeneficiaryAmount = clawbackBeneficiaryBalance.sub(initialClawbackBeneficiaryBalance);
  console.log('Beneficiary clawed TRIBE: ', clawbackBeneficiaryAmount.toString());
  expect(clawbackBeneficiaryAmount).to.be.bignumber.at.least(MIN_BENEFICIARY_CLAWED_TRIBE);

  // 5. Verify beneficiary can claim from new Rari infra timelocks
  const randomAddressReleasingTo = '0xFDFA7223b6A5B00b5eeccfedD3e98FcA65A7F901';
  const preClaimFeiBalance = await fei.balanceOf(randomAddressReleasingTo);
  const preClaimTribeBalance = await tribe.balanceOf(randomAddressReleasingTo);

  const rariOpsMultisigSigner = await getImpersonatedSigner(addresses.rariOpsMultisig);
  await forceEth(addresses.rariOpsMultisig);

  await newRariInfraFeiTimelock.connect(rariOpsMultisigSigner).releaseMax(randomAddressReleasingTo);
  await newRariInfraTribeTimelock.connect(rariOpsMultisigSigner).releaseMax(randomAddressReleasingTo);

  const postClaimFeiBalance = await fei.balanceOf(randomAddressReleasingTo);
  const postClaimTribeBalance = await tribe.balanceOf(randomAddressReleasingTo);
  const claimedFeiAmount = postClaimFeiBalance.sub(preClaimFeiBalance);
  const claimedTribeAmount = postClaimTribeBalance.sub(preClaimTribeBalance);

  console.log('Claimed FEI: ', claimedFeiAmount.toString());
  console.log('Claimed TRIBE: ', claimedTribeAmount.toString());
  expect(claimedFeiAmount).to.be.bignumber.at.least(toBN(1));
  expect(claimedTribeAmount).to.be.bignumber.at.least(toBN(1));

  // 6. Verify that TC timelock has been approved for 20M TRIBE
  const approvedTribeAmount = await tribe.allowance(addresses.feiDAOTimelock, addresses.tribalCouncilTimelock);
  expect(approvedTribeAmount).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul(20_000_000));
  expect(approvedTribeAmount).to.be.bignumber.greaterThan(totalClawedTribe);

  // Verify can transfer
  const tcTimelockSigner = await getImpersonatedSigner(addresses.tribalCouncilTimelock);
  await forceEth(addresses.tribalCouncilTimelock);
  const coreBalanceBefore = await tribe.balanceOf(addresses.core);
  await tribe
    .connect(tcTimelockSigner)
    .transferFrom(addresses.feiDAOTimelock, addresses.core, ethers.constants.WeiPerEther.mul(10_000_000));
  const coreBalanceAfter = await tribe.balanceOf(addresses.core);
  expect(coreBalanceAfter.sub(coreBalanceBefore)).to.be.bignumber.equal(ethers.constants.WeiPerEther.mul(10_000_000));
};

export { deploy, setup, teardown, validate };
