import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { time } from '@test/helpers';
import { BigNumber } from 'ethers';

/*
Withdraw liquidity from the LBP once it has finished
*/

const fipNumber = 'withdraw_lbp_liquidity';

let initialDaiPCVBalance: BigNumber;
let initialTCDpiBalance: BigNumber;

const minExpectedLBPDai = ethers.constants.WeiPerEther.mul(3_000_000);
const minExpectedLBPDpi = ethers.constants.WeiPerEther.mul(100); // TODO

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
  // Fast forward to end of LPB
  const timeRemaining = await contracts.dpiToDaiLBPSwapper.remainingTime();
  await time.increase(timeRemaining);

  initialDaiPCVBalance = await contracts.compoundDaiPCVDeposit.balance();

  const dpi = contracts.dpi;
  initialTCDpiBalance = await dpi.balanceOf(addresses.tribalCouncilSafe);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // Validate that liquidity arrived at target destination
  // Will have DAI and DPI
  // Withdraw DAI to Compound PCV DAI deposit
  // Withdraw DPI to TC multisig, where it can be sold on a DEX
  const finalDAIDepositBalance = await contracts.compoundDaiPCVDeposit.balance();
  expect(finalDAIDepositBalance).to.be.bignumber.at.least(initialDaiPCVBalance.add(minExpectedLBPDai));

  const dpi = contracts.dpi;
  const finalTCDpiBalance = await dpi.balanceOf(addresses.tribalCouncilSafe);
  expect(finalTCDpiBalance).to.be.bignumber.at.least(initialTCDpiBalance.add(minExpectedLBPDpi));
};

export { deploy, setup, teardown, validate };
