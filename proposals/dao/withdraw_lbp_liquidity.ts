import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, time } from '@test/helpers';
import { BigNumber } from 'ethers';
import { forceEth } from '@test/integration/setup/utils';

/*
Withdraw liquidity from the LBP once it has finished
*/

const fipNumber = 'withdraw_lbp_liquidity';

let initialDaiPCVBalance: BigNumber;
let initialTCDpiBalance: BigNumber;

const minExpectedLBPDai = ethers.constants.WeiPerEther.mul(300_000); // TODO, update to accurate numbers
const minExpectedLBPDpi = ethers.constants.WeiPerEther.mul(100); // TODO, update to accurate numbers

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {
    // put returned contract objects here
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const dpi = contracts.dpi;
  initialTCDpiBalance = await dpi.balanceOf(addresses.tribalCouncilSafe);
  initialDaiPCVBalance = await contracts.compoundDaiPCVDeposit.balance();
  console.log('Initial dai balance: ', initialDaiPCVBalance.toString());

  // Fast forward to end of LPB
  const timeRemaining = await contracts.dpiToDaiLBPSwapper.remainingTime();
  await time.increase(timeRemaining);

  await forceEth(addresses.tribalCouncilTimelock);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate safe addresses set on PCVGuardian
  const pcvGuardian = contracts.pcvGuardianNew;
  expect(await pcvGuardian.isSafeAddress(addresses.tribalCouncilSafe)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(addresses.tribalCouncilTimelock)).to.be.true;
  expect(await pcvGuardian.isSafeAddress(addresses.compoundDaiPCVDeposit)).to.be.true;

  // 2. Validate withdrawn liquidity destinations
  const finalDAIDepositBalance = await contracts.compoundDaiPCVDeposit.balance();
  expect(finalDAIDepositBalance).to.be.bignumber.at.least(initialDaiPCVBalance.add(minExpectedLBPDai));

  const dpi = contracts.dpi;
  const finalTCDpiBalance = await dpi.balanceOf(addresses.tribalCouncilSafe);
  expect(finalTCDpiBalance).to.be.bignumber.at.least(initialTCDpiBalance.add(minExpectedLBPDpi));
};

export { deploy, setup, teardown, validate };
