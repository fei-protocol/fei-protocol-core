import { ethers } from 'hardhat';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  PcvStats,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { expect } from 'chai';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const toBN = ethers.BigNumber.from;

const fipNumber = 'tip_121c';

let pcvStatsBefore: PcvStats;

// Amount of FEI sudo() script mints to accounts[0], will be subtracted off
const AMOUNT_FEI_MINTED_BY_E2E = toBN('10000000000000000000000000'); // 10M

/////////////  Tribe Redeemer config
// Circulating amount of TRIBE, which is redeemable for underlying PCV assets
// TODO: Update with final circulating TRIBE figure
const REDEEM_BASE = ethers.constants.WeiPerEther.mul(458_964_340);

// Lido deposit balance, being withdrawn and sent to Tribe Redeemer
const STETH_DEPOSIT_BALANCE = toBN('50296523674661485703301');
const DAO_TIMELOCK_FOX_BALANCE = toBN('15316691965631380244403204');
const DAO_TIMELOCK_LQTY_BALANCE = toBN('1101298805118942906652299');

// Minimum DAI transferred to Redeemer. Lower bound
// TODO: Update with final numbers
const REMAINING_DEPOSIT_DAI_FOR_REDEEMER = ethers.constants.WeiPerEther.mul(30_000_000);

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // SimpleFeiPSM
  const simpleFeiDaiPSMFactory = await ethers.getContractFactory('SimpleFeiDaiPSM');
  const simpleFeiDaiPSM = await simpleFeiDaiPSMFactory.deploy();
  await simpleFeiDaiPSM.deployed();
  console.log('Simple FEI PSM deployed to: ', simpleFeiDaiPSM.address);

  // Tribe Redeemer
  const tribeRedeemerFactory = await ethers.getContractFactory('TribeRedeemer');
  const redeemedToken = addresses.tribe;
  const tokensReceived = [addresses.steth, addresses.lqty, addresses.fox, addresses.dai];

  const tribeRedeemer = await tribeRedeemerFactory.deploy(redeemedToken, tokensReceived, REDEEM_BASE);
  await tribeRedeemer.deployTransaction.wait();
  console.log('Tribe redeemer deployed to: ', tribeRedeemer.address);

  return {
    simpleFeiDaiPSM,
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

  // Calculate protocol controlled Fei and user circulating - subtracting off the 10M FEI
  // our test scripts mint. The use to determin if over collaterised
  const protocolControlledFei = (await contracts.fei.balanceOf(addresses.simpleFeiDaiPSM)).add(
    await contracts.fei.balanceOf(addresses.rariInfraFeiTimelock)
  );

  const userCirculatingFeiSupply = (await contracts.fei.totalSupply())
    .sub(protocolControlledFei)
    .sub(AMOUNT_FEI_MINTED_BY_E2E);
  const protocolEquity = pcvStatsAfter.protocolControlledValue.sub(userCirculatingFeiSupply) as any;
  console.log('Fei Total supply: ', (await contracts.fei.totalSupply()) / 1e24, '(millions)');
  console.log('Protocol controlled fei: ', protocolControlledFei / 1e24, '(millions)');
  console.log('User circulating Fei supply: ', userCirculatingFeiSupply / 1e24, '(millions)');
  console.log('Protocol equity: ', protocolEquity / 1e24, '(millions)');
  expect(protocolEquity).to.bignumber.greaterThan(toBN(1));

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

  // 1. Verify old DAI PSM is deprecated
  // Has no funds
  expect(await contracts.fei.balanceOf(addresses.daiFixedPricePSM)).to.equal(0);
  expect(await contracts.dai.balanceOf(addresses.daiFixedPricePSM)).to.equal(0);

  // Fully paused
  expect(await contracts.daiFixedPricePSM.paused()).to.be.true;
  expect(await contracts.daiFixedPricePSM.redeemPaused()).to.be.true;
  expect(await contracts.daiFixedPricePSM.mintPaused()).to.be.true;

  // 2. Verify new DAI PSM has DAI and no FEI (should have been burned)
  // DAI on PSM should cover the user circulating supply of FEI
  expect(await contracts.dai.balanceOf(addresses.simpleFeiDaiPSM)).to.be.bignumber.greaterThan(
    userCirculatingFeiSupply
  );
  expect(await contracts.fei.balanceOf(addresses.simpleFeiDaiPSM)).to.equal(0);

  // 3. Detailed mint and redeem e2e tests are in 'simpleFeiDaiPSM.ts'
  // Tests here are sanity checks only that functions work
  // Swap
  const daiWhale = '0x5777d92f208679DB4b9778590Fa3CAB3aC9e2168';
  await forceEth(daiWhale);
  const daiWhaleSigner = await getImpersonatedSigner(daiWhale);
  const initialWhaleDaiBalance = await contracts.dai.balanceOf(daiWhale);
  const initialPSMDaiBalance = await contracts.dai.balanceOf(addresses.simpleFeiDaiPSM);
  const amountIn = ethers.constants.WeiPerEther.mul(1_000);

  // Mint 1000 FEI, by transferring in 1000 DAI
  await contracts.dai.connect(daiWhaleSigner).approve(addresses.simpleFeiDaiPSM, amountIn);
  await contracts.simpleFeiDaiPSM.connect(daiWhaleSigner).mint(daiWhale, amountIn, amountIn);

  // User should have been minted FEI - 1000 DAI sent to contract, 1000 FEI minted to user
  expect(await contracts.fei.balanceOf(daiWhale)).to.equal(amountIn);
  const whaleDaiDiff = initialWhaleDaiBalance.sub(await contracts.dai.balanceOf(daiWhale));
  expect(whaleDaiDiff).to.equal(amountIn);
  expect((await contracts.dai.balanceOf(addresses.simpleFeiDaiPSM)).sub(initialPSMDaiBalance)).to.equal(amountIn);

  // Redeem - swap 1000 FEI for 1000 DAI. Contract left with 1000 FEI
  await contracts.fei.connect(daiWhaleSigner).approve(addresses.simpleFeiDaiPSM, amountIn);
  await contracts.simpleFeiDaiPSM.connect(daiWhaleSigner).redeem(daiWhale, amountIn, amountIn);
  expect(await contracts.fei.balanceOf(addresses.simpleFeiDaiPSM)).to.equal(amountIn);
  expect(await contracts.fei.balanceOf(daiWhale)).to.equal(0);
  expect(await contracts.dai.balanceOf(daiWhale)).to.equal(initialWhaleDaiBalance);

  // Burn the 1000 FEI held on the contract
  await contracts.simpleFeiDaiPSM.burnFeiHeld();
  expect(await contracts.fei.balanceOf(addresses.simpleFeiDaiPSM)).to.equal(0);

  //////////////////////    TRIBE REDEEMER    /////////////////////
  // 4. Verify Tribe Redeemer contract deploy params
  expect(await contracts.tribeRedeemer.redeemBase()).to.equal(REDEEM_BASE);
  expect(await contracts.tribeRedeemer.redeemedToken()).to.equal(addresses.tribe);
  const expectedTokensReceived = [addresses.steth, addresses.lqty, addresses.fox, addresses.dai];
  const actualTokensReceived = await contracts.tribeRedeemer.tokensReceivedOnRedeem();
  console.log(
    'Tokens received contract deploy params: ',
    actualTokensReceived[0],
    actualTokensReceived[1],
    actualTokensReceived[2],
    actualTokensReceived[3]
  );
  expect(actualTokensReceived.length).to.equal(expectedTokensReceived.length);
  expect(actualTokensReceived).to.contain(actualTokensReceived[0]);
  expect(actualTokensReceived).to.contain(actualTokensReceived[1]);
  expect(actualTokensReceived).to.contain(actualTokensReceived[2]);
  expect(actualTokensReceived).to.contain(actualTokensReceived[3]);

  // 5. Verify Tribe Redeemer has all PCV assets deposited on it
  // stETH is rebasing, so amount transfered to tribeRedeemer will be greater than current amount on deposit
  expect(await contracts.steth.balanceOf(addresses.tribeRedeemer)).to.be.bignumber.greaterThan(STETH_DEPOSIT_BALANCE);
  expect(await contracts.dai.balanceOf(addresses.tribeRedeemer)).to.be.bignumber.greaterThan(
    REMAINING_DEPOSIT_DAI_FOR_REDEEMER
  );
  expect(await contracts.lqty.balanceOf(addresses.tribeRedeemer)).to.equal(DAO_TIMELOCK_LQTY_BALANCE);
  expect(await contracts.fox.balanceOf(addresses.tribeRedeemer)).to.equal(DAO_TIMELOCK_FOX_BALANCE);
};

export { deploy, setup, teardown, validate };
