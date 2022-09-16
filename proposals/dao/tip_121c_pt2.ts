import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

/*

Tribe Redemption 

*/

// Configuration

// Circulating amount of TRIBE, which is redeemable for underlying PCV assets
// TODO: Update with final circulating TRIBE figure
const REDEEM_BASE = ethers.constants.WeiPerEther.mul(500_000_000);

// Lido deposit balance, being withdrawn and sent to Tribe Redeemer
// TODO: Check
const STETH_DEPOSIT_BALANCE = '50296523674661485703301';

const DAO_TIMELOCK_FOX_BALANCE = '15316691965631380244403204';
const DAO_TIMELOCK_LQTY_BALANCE = '1101298805118942906652299';

// Minimum amount of DAI redeemable for Tribe (total DAI held - amount on FeiPSM)
// TODO: Update with final numbers
const MIN_DAI_REEMABLE = ethers.constants.WeiPerEther.mul(60_000_000);

const fipNumber = 'tip_121c_pt2';

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
  // 0. Verify Tribe Redeemer contract deploy params
  expect(await contracts.tribeRedeemer.redeemBase()).to.equal(REDEEM_BASE);
  expect(await contracts.tribeRedeemer.redeemedToken()).to.equal(addresses.tribe);

  const expectedTokensReceived = [addresses.steth, addresses.lqty, addresses.fox];
  const actualTokensReceived = await contracts.tribeRedeemer.tokensReceivedOnRedeem();
  expect(actualTokensReceived.length).to.equal(expectedTokensReceived.length);
  expect(actualTokensReceived).to.contain(actualTokensReceived[0]);
  expect(actualTokensReceived).to.contain(actualTokensReceived[1]);
  expect(actualTokensReceived).to.contain(actualTokensReceived[2]);

  // 1. Verify Tribe Redeemer has all PCV assets deposited on it
  expect(await contracts.steth.balanceOf(addresses.tribeRedeemer)).to.equal(STETH_DEPOSIT_BALANCE);
  expect(await contracts.dai.balanceOf(addresses.tribeRedeemer)).to.be.bignumber.greaterThan(MIN_DAI_REEMABLE);
  expect(await contracts.lqty.balanceOf(addresses.tribeRedeemer)).to.equal(DAO_TIMELOCK_LQTY_BALANCE);
  expect(await contracts.fox.balanceOf(addresses.tribeRedeemer)).to.equal(DAO_TIMELOCK_FOX_BALANCE);

  // 2. Verify previewRedeem() gives a reasonable value

  // 3. Verify redeem() looks reasonable
};

export { deploy, setup, teardown, validate };
