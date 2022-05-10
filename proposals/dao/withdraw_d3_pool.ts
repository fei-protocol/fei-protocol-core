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

const fipNumber = 'withdraw_from_d3Pool';

let convexResistantBalanceBefore: any;
let convexFeiBalanceBefore: any;
let curveResistantBalanceBefore: any;
let curveFeiBalanceBefore: any;
let daiInitialPSMFeiBalance: any;

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

  const LPWithdrawAmount = ethers.constants.WeiPerEther.mul(30_000_000);
  const feiWithdrawAmount = ethers.constants.WeiPerEther.mul(10_000_000);

  // 2. Validate withdraw convexPCVDeposit
  const [convexResistantBalanceAfter, convexFeiBalanceAfter] = await convexPCVDeposit.resistantBalanceAndFei();
  expect(convexFeiBalanceAfter).to.bignumber.equal(convexFeiBalanceBefore); // Fei balance shouldn't have changed

  // Might need calculating
  // expect(convexResistantBalanceAfter).to.bignumber.equal(convexResistantBalanceBefore.sub(LPWithdrawAmount));

  // 3. Validate curvePCVDeposit
  const [curveResistantBalanceAfter, curveFeiBalanceAfter] = await curvePCVDeposit.resistantBalanceAndFei();
  expect(curveFeiBalanceAfter).to.bignumber.equal(curveFeiBalanceBefore.sub(feiWithdrawAmount));

  // Might need calculating
  // expect(curveResistantBalanceAfter).to.bignumber.equal(curveResistantBalanceBefore.sub(feiWithdrawAmount));

  console.log(
    'convex balance before',
    convexResistantBalanceBefore.toString(),
    'convex balance afer',
    convexResistantBalanceAfter.toString(),
    'convex fei before',
    convexFeiBalanceBefore.toString(),
    'convex fei after',
    convexFeiBalanceAfter.toString()
  );

  const daiPSMFeiBalance = await daiFixedPricePSM.feiBalance();
  expect(daiPSMFeiBalance).to.be.equal(daiInitialPSMFeiBalance.add(feiWithdrawAmount));
};

export { deploy, setup, teardown, validate };
