import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  PcvStats,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { BigNumber } from 'ethers';
import { getImpersonatedSigner, overwriteChainlinkAggregator } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

TIP-114: Deprecate TRIBE Incentives system

*/

const fipNumber = 'TIP-114: Deprecate TRIBE Incentives system';

let initialCoreTribeBalance: BigNumber;
let initialRariDelegatorBalance: BigNumber;
let pcvStatsBefore: PcvStats;
let daiBalanceBefore: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy agEUR Redeemer contract
  const angleEuroRedeemerFactory = await ethers.getContractFactory('AngleEuroRedeemer');
  const angleEuroRedeemer = await angleEuroRedeemerFactory.deploy();
  await angleEuroRedeemer.deployed();
  logging && console.log(`angleEuroRedeemer: ${angleEuroRedeemer.address}`);

  return {
    angleEuroRedeemer
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // deprecate incentives setup
  const tribe = contracts.tribe;
  initialCoreTribeBalance = await tribe.balanceOf(addresses.core);
  initialRariDelegatorBalance = await tribe.balanceOf(addresses.rariRewardsDistributorDelegator);

  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice).toString(), '8');

  // read pcvStats before proposal execution
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();

  // angle multisig action : make enough USDC collateral available for redemptions
  const angleMultisigSigner = await getImpersonatedSigner('0x0C2553e4B9dFA9f83b1A6D3EAB96c4bAaB42d430');
  await forceEth(angleMultisigSigner.address);
  await contracts.anglePoolManagerUsdc.connect(angleMultisigSigner).updateStrategyDebtRatio(
    addresses.angleStrategyUsdc1, // USDC strategy has 57M deployed
    '0'
  );
  await contracts.angleStrategyUsdc1.harvest();

  // read DAI PSM balance before proposal execution
  daiBalanceBefore = await contracts.dai.balanceOf(addresses.daiFixedPricePSM);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // ------------------------------------------------------------
  // Deprecate incentives validation
  // ------------------------------------------------------------
  const tribe = contracts.tribe;
  const core = contracts.core;
  const tribalChief = contracts.tribalChief;

  const minExpectedTribeRecovery = ethers.constants.WeiPerEther.mul(30_000_000);
  const remainingTRIBELPRewards = ethers.constants.WeiPerEther.mul(564_000);
  const excessRariTribeToExtract = ethers.constants.WeiPerEther.mul(150_000);
  const maxRemainingExtraChiefBalance = ethers.constants.WeiPerEther.mul(30_000);

  // 0. Verify all staking token wrapper pending rewards are zero
  expect(await tribalChief.pendingRewards(3, addresses.stakingTokenWrapperRari)).to.equal(0);
  expect(await tribalChief.pendingRewards(4, addresses.stakingTokenWrapperGROLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(5, addresses.stakingTokenWrapperFOXLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(6, addresses.stakingTokenWrapperUMALaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(7, addresses.stakingTokenWrapperSYNLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(8, addresses.stakingTokenWrapperNEARLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(9, addresses.stakingTokenWrapperKYLINLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(10, addresses.stakingTokenWrapperMStableLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(11, addresses.stakingTokenWrapperPoolTogetherLaaS)).to.equal(0);
  expect(await tribalChief.pendingRewards(12, addresses.stakingTokenWrapperBribeD3pool)).to.equal(0);
  expect(await tribalChief.pendingRewards(13, addresses.d3StakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(14, addresses.fei3CrvStakingtokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(15, addresses.feiDaiStakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(16, addresses.feiUsdcStakingTokenWrapper)).to.equal(0);
  expect(await tribalChief.pendingRewards(17, addresses.stakingTokenWrapperBribe3Crvpool)).to.equal(0);

  // 1. Validate all the locations TRIBE was withdrawn from are empty
  expect(await tribe.balanceOf(addresses.votiumBriber3Crvpool)).to.equal(0);
  expect(await tribe.balanceOf(addresses.erc20Dripper)).to.equal(0);
  expect(await tribe.balanceOf(addresses.votiumBriberD3pool)).to.equal(0);

  // 2. Validate TribalChief has sufficient TRIBE to fund LP staking deposits
  expect(await tribe.balanceOf(addresses.tribalChief)).to.be.bignumber.at.least(remainingTRIBELPRewards);

  // Validate remaining balance of TribalChief is small
  const finalTribalChiefBalance = await tribe.balanceOf(addresses.tribalChief);
  console.log('Final TribalChief balance:', finalTribalChiefBalance.toString());
  expect(finalTribalChiefBalance).to.be.bignumber.lessThan(maxRemainingExtraChiefBalance.add(remainingTRIBELPRewards));

  // 3. Validate excess TRIBE was pulled from Rari rewards delegate
  const finalRariDelegatorBalance = await tribe.balanceOf(addresses.rariRewardsDistributorDelegator);
  const extractedRariTribe = initialRariDelegatorBalance.sub(finalRariDelegatorBalance);
  expect(extractedRariTribe).to.be.bignumber.at.least(excessRariTribeToExtract); // At least check, as rewards may have been claimed also

  // 4. Validate expected TRIBE recovery amount was retrieved
  const finalCoreTribeBalance = await tribe.balanceOf(addresses.core);
  const tribeRecovered = finalCoreTribeBalance.sub(initialCoreTribeBalance);
  console.log('Tribe recovered: ', tribeRecovered.toString());
  expect(tribeRecovered).to.be.bignumber.at.least(minExpectedTribeRecovery);

  // 5. Validate Aave incentives controller proxy admin was changed
  const aaveLendingPoolAddressesProviderSigner = await getImpersonatedSigner(
    addresses.aaveLendingPoolAddressesProvider
  );
  const proxyABI = ['function admin() returns (address)'];
  const aaveTribeIncentivesControllerAsProxy = new ethers.Contract(addresses.aaveTribeIncentivesController, proxyABI);
  await forceEth(addresses.aaveTribeIncentivesController);
  expect(
    await aaveTribeIncentivesControllerAsProxy.connect(aaveLendingPoolAddressesProviderSigner).callStatic.admin()
  ).to.be.equal(addresses.aaveLendingPoolAddressesProvider);

  // 6. Validate TRIBAL_CHIEF_ADMIN_ROLE is revoked
  expect(await core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.tribalCouncilTimelock)).to.be.false;
  expect(await core.hasRole(ethers.utils.id('TRIBAL_CHIEF_ADMIN_ROLE'), addresses.optimisticTimelock)).to.be.false;

  // ------------------------------------------------------------
  // ANGLE and agEUR Deprecation
  // ------------------------------------------------------------
  // check ANGLE token movement
  expect(await contracts.angle.balanceOf(addresses.angleDelegatorPCVDeposit)).to.be.equal('0');
  expect(await contracts.angle.balanceOf(addresses.tribalCouncilSafe)).to.be.at.least(
    ethers.utils.parseEther('200000')
  );
  // check deposit is empty
  expect(await contracts.agEurUniswapPCVDeposit.balance()).to.be.equal('0');
  expect(await contracts.fei.balanceOf(addresses.agEurUniswapPCVDeposit)).to.be.equal('0');
  expect(await contracts.agEUR.balanceOf(addresses.agEurUniswapPCVDeposit)).to.be.equal('0');

  // check redemptions of agEUR > DAI
  const daiRedeemed = (await contracts.dai.balanceOf(addresses.daiFixedPricePSM)).sub(daiBalanceBefore);
  console.log('daiRedeemed', daiRedeemed.toString() / 1e18);
  expect(daiRedeemed).to.be.at.least(ethers.utils.parseEther('9500000')); // >9.5M DAI

  // check redeemer is empty
  expect(await contracts.agEUR.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.fei.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.dai.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');
  expect(await contracts.usdc.balanceOf(addresses.angleEuroRedeemer)).to.be.equal('0');

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

  // PCV Equity change should be neutral for this proposal
  expect(Number(eqDiff) / 1e18).to.be.at.least(-10000);
  expect(Number(eqDiff) / 1e18).to.be.at.most(+10000);
};

export { deploy, setup, teardown, validate };
