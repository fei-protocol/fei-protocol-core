import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';
import { forceEth } from '@test/integration/setup/utils';

/*
Withdraw FEI from Aave and Compound
*/

const fipNumber = '9001'; // Change me!

let aavePCVBalanceBefore: BigNumber;
let compoundPCVBalanceBefore: BigNumber;
let daiInitialPSMFeiBalance: BigNumber;
const totalFeiWithdraw = ethers.constants.WeiPerEther.mul(9_400_000);

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  console.log(`No deploy actions for fip${fipNumber}`);
  return {};
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in setup for fip${fipNumber}`);
  aavePCVBalanceBefore = await contracts.aaveFeiPCVDeposit.balance();
  compoundPCVBalanceBefore = await contracts.compoundFeiPCVDepositWrapper.balance();
  daiInitialPSMFeiBalance = await contracts.daiFixedPricePSM.feiBalance();

  await forceEth(addresses.tribalCouncilTimelock);
  await forceEth(addresses.tribalCouncilSafe);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // 1. Validate Aave PCV deposit
  const aavePCVBalanceAfter = await contracts.aaveFeiPCVDeposit.balance();
  expect(aavePCVBalanceAfter).to.bignumber.at.least(
    aavePCVBalanceBefore.sub(ethers.constants.WeiPerEther.mul(6_500_000))
  );

  expect(aavePCVBalanceAfter).to.bignumber.at.most(
    aavePCVBalanceBefore.sub(ethers.constants.WeiPerEther.mul(6_300_000))
  );

  // 2. Validate Compound PCV deposit
  const compoundPCVBalanceAfter = await contracts.compoundFeiPCVDepositWrapper.balance();
  expect(compoundPCVBalanceAfter).to.bignumber.at.least(
    compoundPCVBalanceBefore.sub(ethers.constants.WeiPerEther.mul(3_100_000))
  );

  expect(compoundPCVBalanceAfter).to.bignumber.at.most(
    compoundPCVBalanceBefore.sub(ethers.constants.WeiPerEther.mul(2_900_000))
  );

  // 3. Validate funds received by DAI PSM
  const daiFixedPricePSMBalance = await contracts.daiFixedPricePSM.feiBalance();
  expect(daiFixedPricePSMBalance).to.be.equal(daiInitialPSMFeiBalance.add(totalFeiWithdraw));
};

export { deploy, setup, teardown, validate };
