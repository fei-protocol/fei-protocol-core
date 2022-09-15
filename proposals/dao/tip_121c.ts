import { ethers } from 'hardhat';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';
import { expect } from 'chai';

const toBN = BigNumber.from;

const fipNumber = 'tip_121c';

// Minimum amount of DAI expected to be on the new DAI PSM
const MIN_DAI_ON_NEW_PSM = ethers.constants.WeiPerEther.mul(50_000_000);

// Bounds on PCV equity differences
const MAX_PCV_EQUITY_DIFF = ethers.constants.WeiPerEther.mul(1_000_000);
const MIN_PCV_EQUITY_DIFF = ethers.constants.WeiPerEther.mul(1_000_000);

let pcvStatsBefore: PcvStats;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const simpleFeiDaiPSMFactory = await ethers.getContractFactory('SimpleFeiDaiPSM');
  const simpleFeiDaiPSM = await simpleFeiDaiPSMFactory.deploy();
  await simpleFeiDaiPSM.deployed();
  logging && console.log(`simpleFeiDaiPSM: ${simpleFeiDaiPSM.address}`);

  return {
    simpleFeiDaiPSM
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // display pcvStats
  console.log('----------------------------------------------------');
  console.log(' pcvStatsBefore.protocolControlledValue [M]e18 ', Number(pcvStatsBefore.protocolControlledValue) / 1e24);
  console.log(' pcvStatsBefore.userCirculatingFei      [M]e18 ', Number(pcvStatsBefore.userCirculatingFei) / 1e24);
  console.log(' pcvStatsBefore.protocolEquity          [M]e18 ', Number(pcvStatsBefore.protocolEquity) / 1e24);
  const pcvStatsAfter: PcvStats = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log(' pcvStatsAfter.protocolControlledValue  [M]e18 ', Number(pcvStatsAfter.protocolControlledValue) / 1e24);
  console.log(' pcvStatsAfter.userCirculatingFei       [M]e18 ', Number(pcvStatsAfter.userCirculatingFei) / 1e24);
  console.log(' pcvStatsAfter.protocolEquity           [M]e18 ', Number(pcvStatsAfter.protocolEquity) / 1e24);
  console.log('----------------------------------------------------');
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', Number(pcvDiff) / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', Number(cFeiDiff) / 1e24);
  console.log(' Equity diff                            [M]e18 ', Number(eqDiff) / 1e24);
  console.log('----------------------------------------------------');

  // check pcv movements
  console.log(
    'daiFixedPricePSM resistant balance',
    (await contracts.daiFixedPricePSM.resistantBalanceAndFei())[0] / 1e18
  );
  console.log(
    'daiFixedPricePSM resistant fei    ',
    (await contracts.daiFixedPricePSM.resistantBalanceAndFei())[1] / 1e18
  );
  console.log(
    'simpleFeiDaiPSM DAI balance',
    (await contracts.dai.balanceOf(addresses.simpleFeiDaiPSM)) / 1e24,
    '(millions)'
  );
  console.log('simpleFeiDaiPSM FEI balance', (await contracts.fei.balanceOf(addresses.simpleFeiDaiPSM)) / 1e18);

  // 0. Verify PCV equity diff is small
  expect(eqDiff).to.be.bignumber.lessThan(MAX_PCV_EQUITY_DIFF);
  expect(eqDiff).to.be.bignumber.greaterThan(MIN_PCV_EQUITY_DIFF);

  // 1. Verify old DAI PSM is deprecated
  // Has no funds
  expect(await contracts.fei.balanceOf(addresses.daiFixedPricePSM)).to.equal(0);
  expect(await contracts.dai.balanceOf(addresses.daiFixedPricePSM)).to.equal(0);

  // Fully paused
  expect(await contracts.daiFixedPricePSM.paused()).to.be.true;
  expect(await contracts.daiFixedPricePSM.redeemPaused()).to.be.true;
  expect(await contracts.daiFixedPricePSM.mintPaused()).to.be.true;

  // 2. Verify new DAI PSM has DAI and no FEI (should have been burned)
  expect(await contracts.dai.balanceOf(addresses.daiFixedPricePSM)).to.be.bignumber.greaterThan(MIN_DAI_ON_NEW_PSM);
  expect(await contracts.fei.balanceOf(addresses.daiFixedPricePSM)).to.equal(0);

  // 3. Perform a swap, verify 1:1, totalSupply changes accordingly

  // 4. Perform a redeem, verify 1:1
};

export { deploy, setup, teardown, validate };
