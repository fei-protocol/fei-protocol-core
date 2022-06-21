import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { ZERO_ADDRESS, overwriteChainlinkAggregator } from '@test/helpers';

const fipNumber = 'oa_cr_fix';
let pcvStatsBefore;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deploy lens to report B-30FEI-70WETH as WETH and protocol-owned FEI
  // (The new contract contains a fix)
  const balancerPool2LensFactory = await ethers.getContractFactory('BalancerPool2Lens');
  const balancerLensBpt30Fei70Weth = await balancerPool2LensFactory.deploy(
    addresses.gaugeLensBpt30Fei70WethGauge, // address _depositAddress
    addresses.weth, // address _token
    addresses.bpt30Fei70Weth, // IWeightedPool _pool
    addresses.chainlinkEthUsdOracleWrapper, // IOracle _reportedOracle
    addresses.oneConstantOracle, // IOracle _otherOracle
    false, // bool _feiIsReportedIn
    true // bool _feiIsOther
  );
  await balancerLensBpt30Fei70Weth.deployTransaction.wait();
  logging && console.log('balancerLensBpt30Fei70Weth: ', balancerLensBpt30Fei70Weth.address);

  return {
    balancerLensBpt30Fei70Weth
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`Setup of ${fipNumber} : reading CR oracle...`);

  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice), '8');

  // read pcvStats
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
  // Check the removed PCV Deposits
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool8FeiPCVDepositWrapper)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool8DaiPCVDeposit)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool8LusdPCVDeposit)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool18FeiPCVDepositWrapper)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool27FeiPCVDepositWrapper)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool90FeiPCVDepositWrapper)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool146EthPCVDeposit)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.convexPoolPCVDepositWrapper)).to.be.equal(
    ZERO_ADDRESS
  );

  // Check the lens swap
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerLensBpt30Fei70WethOld)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerLensBpt30Fei70Weth)).to.be.equal(
    addresses.weth
  );

  // Check the new lens returned values
  const balance = (await contracts.balancerLensBpt30Fei70Weth.balance()) / 1e18;
  const resistantBalanceAndFei = await contracts.balancerLensBpt30Fei70Weth.resistantBalanceAndFei();
  const resistantBalance = resistantBalanceAndFei[0] / 1e18;
  const resistantFei = resistantBalanceAndFei[1] / 1e18;
  // 15.86k ETH, 16.3M FEI on 2022-05-10
  expect(balance).to.be.at.least(14000);
  expect(balance).to.be.at.most(18000);
  expect(resistantBalance).to.be.at.least(14000);
  expect(resistantBalance).to.be.at.most(18000);
  expect(resistantFei).to.be.at.least(10e6);
  expect(resistantFei).to.be.at.most(25e6);

  // display pcvStats
  console.log('----------------------------------------------------');
  console.log(' pcvStatsBefore.protocolControlledValue [M]e18 ', pcvStatsBefore.protocolControlledValue / 1e24);
  console.log(' pcvStatsBefore.userCirculatingFei      [M]e18 ', pcvStatsBefore.userCirculatingFei / 1e24);
  console.log(' pcvStatsBefore.protocolEquity          [M]e18 ', pcvStatsBefore.protocolEquity / 1e24);
  const pcvStatsAfter = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log(' pcvStatsAfter.protocolControlledValue  [M]e18 ', pcvStatsAfter.protocolControlledValue / 1e24);
  console.log(' pcvStatsAfter.userCirculatingFei       [M]e18 ', pcvStatsAfter.userCirculatingFei / 1e24);
  console.log(' pcvStatsAfter.protocolEquity           [M]e18 ', pcvStatsAfter.protocolEquity / 1e24);
  console.log('----------------------------------------------------');
  const pcvDiff = pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue);
  const cFeiDiff = pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei);
  const eqDiff = pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity);
  console.log(' PCV diff                               [M]e18 ', pcvDiff / 1e24);
  console.log(' Circ FEI diff                          [M]e18 ', cFeiDiff / 1e24);
  console.log(' Equity diff                            [M]e18 ', eqDiff / 1e24);
  console.log('----------------------------------------------------');
};

export { deploy, setup, teardown, validate };
