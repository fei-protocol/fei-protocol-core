import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

Tribe Redemption 

*/

// Circulating amount of TRIBE, which is redeemable for underlying PCV assets
// TODO: Update with final circulating TRIBE figure
const REDEEM_BASE = ethers.constants.WeiPerEther.mul(500_000_000);

// Lido deposit balance, being withdrawn and sent to Tribe Redeemer
// TODO: Check
const STETH_DEPOSIT_BALANCE = '50296523674661485703301';

const DAO_TIMELOCK_FOX_BALANCE = '15316691965631380244403204';
const DAO_TIMELOCK_LQTY_BALANCE = '1101298805118942906652299';

// Minimum DAI_HOLDING_DEPOSIT_BALANCEamount of DAI redeemable for Tribe (total DAI held - amount on FeiPSM)
// TODO: Update with final numbers
const DAI_HOLDING_DEPOSIT_BALANCE = ethers.constants.WeiPerEther.mul(60_000_000);

const fipNumber = 'tip_121c_pt2';

let pcvStatsBefore: PcvStats;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const tribeRedeemerFactory = await ethers.getContractFactory('TribeRedeemer');

  // Asset which can be redeemed for underlying PCV
  const redeemedToken = addresses.tribe;

  // Assets which the redeemedToken is redeemable for
  // TODO: Verify these tokensReceived
  const tokensReceived = [addresses.steth, addresses.lqty, addresses.fox];

  const tribeRedeemer = await tribeRedeemerFactory.deploy(redeemedToken, tokensReceived, REDEEM_BASE);
  await tribeRedeemer.deployTransaction.wait();
  console.log('Tribe redeemer deployed to: ', tribeRedeemer.address);

  return {
    tribeRedeemer
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
  // 0. Verify PCV did not change significantly

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

  // expect(eqDiff).to.be.bignumber.greaterThan();
  // expect(eqDiff).to.be.bignumber.lessThan();
  expect(await contracts.collateralizationOracle.isOvercollateralized()).to.be.true;

  // 1. Verify Tribe Redeemer contract deploy params
  expect(await contracts.tribeRedeemer.redeemBase()).to.equal(REDEEM_BASE);
  expect(await contracts.tribeRedeemer.redeemedToken()).to.equal(addresses.tribe);

  const expectedTokensReceived = [addresses.steth, addresses.lqty, addresses.fox];
  const actualTokensReceived = await contracts.tribeRedeemer.tokensReceivedOnRedeem();
  expect(actualTokensReceived.length).to.equal(expectedTokensReceived.length);
  expect(actualTokensReceived).to.contain(actualTokensReceived[0]);
  expect(actualTokensReceived).to.contain(actualTokensReceived[1]);
  expect(actualTokensReceived).to.contain(actualTokensReceived[2]);

  // 2. Verify Tribe Redeemer has all PCV assets deposited on it
  expect(await contracts.steth.balanceOf(addresses.tribeRedeemer)).to.equal(STETH_DEPOSIT_BALANCE);
  expect(await contracts.dai.balanceOf(addresses.tribeRedeemer)).to.equal(DAI_HOLDING_DEPOSIT_BALANCE);
  expect(await contracts.lqty.balanceOf(addresses.tribeRedeemer)).to.equal(DAO_TIMELOCK_LQTY_BALANCE);
  expect(await contracts.fox.balanceOf(addresses.tribeRedeemer)).to.equal(DAO_TIMELOCK_FOX_BALANCE);

  // 3. Verify previewRedeem() gives a reasonable value

  // 4. Verify redeem() looks reasonable
};

export { deploy, setup, teardown, validate };
