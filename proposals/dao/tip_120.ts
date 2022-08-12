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
import { BigNumber } from 'ethers';
import { getImpersonatedSigner, overwriteChainlinkAggregator } from '@test/helpers';

const toBN = BigNumber.from;

const fipNumber = 'tip_120';

// Minimum expected DAI from exchanging USDC with DAI via the Maker PSM
const MINIMUM_DAI_FROM_SALE = ethers.constants.WeiPerEther.mul(1_000_000);

// ETH withdrawn from the CEther token in Fuse pool 146
const CETHER_WITHDRAW = toBN('37610435021674550600');

let pcvStatsBefore: PcvStats;
let initialCompoundDAIBalance: BigNumber;
let initialWethBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Create LUSD->DAI Swapper
  const curveSwapperFactory = await ethers.getContractFactory('CurveSwapper');
  const lusdToDaiCurveSwapper = await curveSwapperFactory.deploy(
    addresses.core,
    addresses.lusdCurveMetapool,
    '0', // i
    '1', // j
    addresses.lusd,
    addresses.dai,
    addresses.daiHoldingPCVDeposit,
    0 // minimum 1000 DAI per 1000 LUSD
  );
  await lusdToDaiCurveSwapper.deployed();
  logging && console.log(`lusdToDaiCurveSwapper: ${lusdToDaiCurveSwapper.address}`);

  // Create LUSD->DAI Swap Guard
  const curveSwapperGuardFactory = await ethers.getContractFactory('CurveSwapperGuard');
  const lusdToDaiSwapperGuard = await curveSwapperGuardFactory.deploy(
    addresses.core,
    addresses.pcvGuardian,
    lusdToDaiCurveSwapper.address,
    addresses.lusdHoldingPCVDeposit,
    addresses.daiHoldingPCVDeposit,
    ethers.utils.parseEther('1000000000'), // activate if <1B DAI reserves (i.e. active all the time, convert all DAI)
    ethers.utils.parseEther('5000000') // swap in chunks of 5M LUSD
  );
  await lusdToDaiSwapperGuard.deployed();
  logging && console.log(`lusdToDaiSwapperGuard: ${lusdToDaiSwapperGuard.address}`);

  return {
    lusdToDaiCurveSwapper,
    lusdToDaiSwapperGuard
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();

  // make sure ETH oracle is fresh
  // Read Chainlink OHM : ETH price & override chainlink storage to make it a fresh value.
  // Otherwise fork block is well out of date, oracle will report invalid and CR will be invalid
  const ohmPrice = (await contracts.chainlinkOhmV2EthOracleWrapper.read())[0];
  await overwriteChainlinkAggregator(addresses.chainlinkOHMV2EthOracle, ohmPrice.toString(), '18');

  initialCompoundDAIBalance = await contracts.compoundDaiPCVDeposit.balance();
  initialWethBalance = await contracts.wethHoldingPCVDeposit.balance();
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

  // Validate LUSD to DAI swapper config
  expect(await contracts.lusdToDaiCurveSwapper.curvePool()).to.be.equal(addresses.lusdCurveMetapool);
  expect(await contracts.lusdToDaiCurveSwapper.tokenSpent()).to.be.equal(addresses.lusd);
  expect(await contracts.lusdToDaiCurveSwapper.tokenReceived()).to.be.equal(addresses.dai);
  expect(await contracts.lusdToDaiCurveSwapper.maxSlippageBps()).to.be.equal('50');
  expect(await contracts.lusdToDaiCurveSwapper.tokenReceivingAddress()).to.be.equal(addresses.compoundDaiPCVDeposit);
  expect(await contracts.lusdToDaiCurveSwapper.i()).to.be.equal('0');
  expect(await contracts.lusdToDaiCurveSwapper.j()).to.be.equal('1');

  // Validate Guard trigger of the swapper and swap effect
  const guardianSigner = await getImpersonatedSigner(addresses.guardianMultisig);
  // Knight the guard
  await contracts.pcvSentinel.connect(guardianSigner).knight(contracts.lusdToDaiSwapperGuard.address);
  // Should not be able to protec at first
  expect(await contracts.lusdToDaiSwapperGuard.check()).to.be.equal(false);
  // Create protec-able conditions
  await contracts.pcvGuardian.connect(guardianSigner).withdrawToSafeAddress(
    addresses.compoundDaiPCVDeposit,
    addresses.daiFixedPricePSM,
    (await contracts.compoundDaiPCVDeposit.balance()).sub(ethers.utils.parseEther('9000000')), // all but 9M
    false,
    false
  );
  // Should be able to protec
  expect(await contracts.lusdToDaiSwapperGuard.check()).to.be.equal(true);
  // Read before/after balances and perform protec
  const daiBalanceBefore = await contracts.compoundDaiPCVDeposit.balance();
  const lusdBalanceBefore = await contracts.lusdHoldingPCVDeposit.balance();
  await contracts.pcvSentinel.protec(contracts.lusdToDaiSwapperGuard.address);
  const daiBalanceAfter = await contracts.compoundDaiPCVDeposit.balance();
  const lusdBalanceAfter = await contracts.lusdHoldingPCVDeposit.balance();
  // Check received DAI amount
  expect(daiBalanceAfter.sub(daiBalanceBefore)).to.be.at.least(ethers.utils.parseEther('4975000')); // ~5M
  // Check spent LUSD amount
  expect(lusdBalanceBefore.sub(lusdBalanceAfter)).to.be.equal(ethers.utils.parseEther('5000000')); // 5M
};

export { deploy, setup, teardown, validate };
