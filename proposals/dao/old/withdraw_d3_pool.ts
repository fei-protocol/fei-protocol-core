import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { forceEth } from '@test/integration/setup/utils';
import { BigNumber } from 'ethers';

const fipNumber = 'withdraw_from_d3Pool';

let convexResistantBalanceBefore: BigNumber;
let convexFeiBalanceBefore: BigNumber;
let curveResistantBalanceBefore: BigNumber;
let curveFeiBalanceBefore: BigNumber;
let daiInitialPSMFeiBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  return {};
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const convexPCVDeposit = contracts.d3poolConvexPCVDeposit;
  const curvePCVdeposit = contracts.d3poolCurvePCVDeposit;
  const daiFixedPricePSM = contracts.daiFixedPricePSM;

  [convexResistantBalanceBefore, convexFeiBalanceBefore] = await convexPCVDeposit.resistantBalanceAndFei();
  [curveResistantBalanceBefore, curveFeiBalanceBefore] = await curvePCVdeposit.resistantBalanceAndFei();

  daiInitialPSMFeiBalance = await daiFixedPricePSM.feiBalance();

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
  const convexPCVDeposit = contracts.d3poolConvexPCVDeposit;
  const curvePCVDeposit = contracts.d3poolCurvePCVDeposit;
  const daiFixedPricePSM = contracts.daiFixedPricePSM;
  const feiWithdrawAmount = ethers.constants.WeiPerEther.mul(10_000_000);

  // 2. Validate withdraw convexPCVDeposit - have pulled 30M LP tokens from Convex
  const [convexResistantBalanceAfter, convexFeiBalanceAfter] = await convexPCVDeposit.resistantBalanceAndFei();

  // ~20M in resistantBalance (value of LP tokens?) has been withdrawn
  expect(convexResistantBalanceAfter).to.bignumber.at.least(
    convexResistantBalanceBefore.sub(ethers.constants.WeiPerEther.mul(20_100_000))
  );
  expect(convexResistantBalanceAfter).to.bignumber.at.most(
    convexResistantBalanceBefore.sub(ethers.constants.WeiPerEther.mul(19_900_000))
  );

  // ~10M Fei has been withdrawn - would only expect LP tokens to be withdrawn?
  expect(convexFeiBalanceAfter).to.bignumber.at.least(
    convexFeiBalanceBefore.sub(ethers.constants.WeiPerEther.mul(10_100_000))
  );
  expect(convexFeiBalanceAfter).to.bignumber.at.most(
    convexFeiBalanceBefore.sub(ethers.constants.WeiPerEther.mul(9_900_000))
  );

  // 3. Validate curvePCVDeposit - have transferred 30M LP tokens here, but then withdrawn 10M. Net 20M inflow
  const [curveResistantBalanceAfter, curveFeiBalanceAfter] = await curvePCVDeposit.resistantBalanceAndFei();

  // ~13.6M in resistantBalance net inflow
  expect(curveResistantBalanceAfter).to.bignumber.at.most(
    curveResistantBalanceBefore.add(ethers.constants.WeiPerEther.mul(13_400_000))
  );
  expect(curveResistantBalanceAfter).to.bignumber.at.least(
    curveResistantBalanceBefore.add(ethers.constants.WeiPerEther.mul(13_200_000))
  );

  // ~6.3M Fei net inflow
  expect(curveFeiBalanceAfter).to.bignumber.at.most(
    curveFeiBalanceBefore.add(ethers.constants.WeiPerEther.mul(6_700_000))
  );
  expect(curveFeiBalanceAfter).to.bignumber.at.least(
    curveFeiBalanceBefore.add(ethers.constants.WeiPerEther.mul(6_500_000))
  );

  // 10M net flow into DAI PSM
  const daiPSMFeiBalance = await daiFixedPricePSM.feiBalance();
  expect(daiPSMFeiBalance).to.be.equal(daiInitialPSMFeiBalance.add(feiWithdrawAmount));
};

export { deploy, setup, teardown, validate };
