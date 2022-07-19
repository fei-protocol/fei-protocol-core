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

/*

TIP-119: gOHM to Collaterisation Oracle, Swap USDC

1. Deploy gOHM oracle
2. Set oracle on collaterisation oracle
3. Add gOHM holding deposit to CR 
4. Swap USDC on TC timelock for DAI

*/

const fipNumber = 'tip_119';

const MINIMUM_DAI_FROM_SALE = ethers.constants.WeiPerEther.mul(1_000_000);

let pcvStatsBefore: PcvStats;
let initialCompoundDAIBalance: BigNumber;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  ////////////// 1. Create and deploy gOHM USD oracle
  // const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  // const chainlinkOhmV2EthOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
  //   addresses.core,
  //   addresses.chainlinkOHMV2EthOracle
  // );
  // await chainlinkOhmV2EthOracleWrapper.deployed();
  // logging && console.log(`Deployed Chainlink OhmV2 ETH oracle wrapper to: ${chainlinkOhmV2EthOracleWrapper.address}`);

  // const GOhmEthOracleFactory = await ethers.getContractFactory('GOhmEthOracle');
  // const gOhmEthOracle = await GOhmEthOracleFactory.deploy(addresses.core, addresses.chainlinkOHMV2EthOracle);
  // await gOhmEthOracle.deployed();

  // logging && console.log(`Deployed gOHM Eth Oracle at ${gOhmEthOracle.address}`);

  // // Create the gOHM USD oracle
  // const CompositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  // const gOhmUSDOracle = await CompositeOracleFactory.deploy(
  //   addresses.core,
  //   gOhmEthOracle.address,
  //   addresses.chainlinkEthUsdOracleWrapper,
  //   false
  // );

  // logging && console.log('Deployed gOHM oracle to: ', gOhmUSDOracle.address);

  // Create LUSD->DAI Swapper
  const curveSwapperFactory = await ethers.getContractFactory('CurveSwapper');
  const lusdToDaiCurveSwapper = await curveSwapperFactory.deploy(
    addresses.core,
    addresses.lusdCurveMetapool,
    addresses.lusd,
    addresses.dai,
    addresses.compoundDaiPCVDeposit,
    50 // minimum 995 DAI per 1000 LUSD
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
    addresses.compoundDaiPCVDeposit,
    ethers.utils.parseEther('10000000'), // activate if <10M DAI reserves
    ethers.utils.parseEther('5000000') // swap in chunks of 5M LUSD
  );
  await lusdToDaiSwapperGuard.deployed();
  logging && console.log(`lusdToDaiSwapperGuard: ${lusdToDaiSwapperGuard.address}`);

  return {
    lusdToDaiCurveSwapper,
    lusdToDaiSwapperGuard
    //chainlinkOhmV2EthOracleWrapper,
    //gOhmUSDOracle,
    //gOhmEthOracle
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
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  const gOhmEthOracle = contracts.gOhmEthOracle;
  const gOhmUSDOracle = contracts.gOhmUSDOracle;
  const collateralizationOracle = contracts.collateralizationOracle;
  const gOHMHoldingPCVDeposit = contracts.gOHMHoldingPCVDeposit;

  // 1. Validate gOHM ETH oracle price is valid
  const gOhmETHPrice = (await gOhmEthOracle.read())[0];
  // Eth price is ~$1000. gOHM price is ~$2400
  // Therefore, gOHM price in ETH should be ~ (2400/1000) = 2.4 ETH
  expect(toBN(gOhmETHPrice.value)).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(1));
  expect(toBN(gOhmETHPrice.value)).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(5));

  // 2. gOHM USD oracle price is valid
  const gOhmUSDPrice = (await gOhmUSDOracle.read())[0];
  expect(toBN(gOhmUSDPrice.value)).to.be.bignumber.at.least(ethers.constants.WeiPerEther.mul(1_000)); // $1000
  expect(toBN(gOhmUSDPrice.value)).to.be.bignumber.at.most(ethers.constants.WeiPerEther.mul(5_000)); // $5000

  // 3. Verify deposit and oracle added to CR
  expect(await collateralizationOracle.isTokenInPcv(addresses.gohm)).to.be.true;
  expect(await collateralizationOracle.depositToToken(gOHMHoldingPCVDeposit.address)).to.be.equal(addresses.gohm);

  // 4. Verify USDC sold for DAI
  const finalCompoundDaiBalance = await contracts.compoundDaiPCVDeposit.balance();
  const depositDAIIncrease = finalCompoundDaiBalance.sub(initialCompoundDAIBalance);
  expect(depositDAIIncrease).to.be.bignumber.greaterThan(MINIMUM_DAI_FROM_SALE);

  const finalTCUSDCBalance = await contracts.usdc.balanceOf(addresses.tribalCouncilTimelock);
  expect(finalTCUSDCBalance).to.be.equal(0);

  // 5. Verify pcvStats increased as expected
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

  // PCV Equity increase should be ~$2.5M
  expect(Number(eqDiff) / 1e18).to.be.at.least(2_000_000);
  expect(Number(eqDiff) / 1e18).to.be.at.most(3_000_000);

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
