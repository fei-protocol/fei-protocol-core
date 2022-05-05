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
  const balancerLensBpt30Fei70WethFixed = await balancerPool2LensFactory.deploy(
    addresses.gaugeLensBpt30Fei70WethGauge, // address _depositAddress
    addresses.wethERC20, // address _token
    '0x90291319f1d4ea3ad4db0dd8fe9e12baf749e845', // IWeightedPool _pool
    addresses.chainlinkEthUsdOracleWrapper, // IOracle _reportedOracle
    addresses.oneConstantOracle, // IOracle _otherOracle
    false, // bool _feiIsReportedIn
    true // bool _feiIsOther
  );
  await balancerLensBpt30Fei70WethFixed.deployTransaction.wait();
  logging && console.log('balancerLensBpt30Fei70WethFixed: ', balancerLensBpt30Fei70WethFixed.address);

  return {
    balancerLensBpt30Fei70WethFixed
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`Setup of ${fipNumber} : reading CR oracle...`);
  pcvStatsBefore = await contracts.collateralizationOracle.pcvStats();

  // make sure oracle of B.AMM is fresh
  // set Chainlink ETHUSD to a fixed 3,000$ value
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, '300000000000', '8');
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
  expect(await contracts.collateralizationOracle.depositToToken(addresses.rariPool146EthPCVDeposit)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.convexPoolPCVDepositWrapper)).to.be.equal(
    ZERO_ADDRESS
  );

  // Check the lens swap
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerLensBpt30Fei70Weth)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerLensBpt30Fei70WethFixed)).to.be.equal(
    addresses.weth
  );

  // Check the new lens returned values
  const balance = (await contracts.balancerLensBpt30Fei70WethFixed.balance()) / 1e18;
  const resistantBalanceAndFei = await contracts.balancerLensBpt30Fei70WethFixed.resistantBalanceAndFei();
  const resistantBalance = resistantBalanceAndFei[0] / 1e18;
  const resistantFei = resistantBalanceAndFei[1] / 1e18;
  expect(balance).to.be.at.least(14000);
  expect(balance).to.be.at.most(16000);
  expect(resistantBalance).to.be.at.least(14000);
  expect(resistantBalance).to.be.at.most(16000);
  expect(resistantFei).to.be.at.least(17e6);
  expect(resistantFei).to.be.at.most(20e6);

  // Check pcvStats
  console.log('----------------------------------------------------');
  console.log('pcvStatsBefore.protocolControlledValue [M]e18 ', pcvStatsBefore.protocolControlledValue / 1e24);
  console.log('pcvStatsBefore.userCirculatingFei [M]e18      ', pcvStatsBefore.userCirculatingFei / 1e24);
  console.log('pcvStatsBefore.protocolEquity [M]e18          ', pcvStatsBefore.protocolEquity / 1e24);
  const pcvStatsAfter = await contracts.collateralizationOracle.pcvStats();
  console.log('----------------------------------------------------');
  console.log('pcvStatsAfter.protocolControlledValue [M]e18  ', pcvStatsAfter.protocolControlledValue / 1e24);
  console.log('pcvStatsAfter.userCirculatingFei [M]e18       ', pcvStatsAfter.userCirculatingFei / 1e24);
  console.log('pcvStatsAfter.protocolEquity [M]e18           ', pcvStatsAfter.protocolEquity / 1e24);
  console.log('----------------------------------------------------');
  console.log(
    'PCV diff [M]e18      ',
    pcvStatsAfter.protocolControlledValue.sub(pcvStatsBefore.protocolControlledValue) / 1e24
  );
  console.log('Circ FEI diff [M]e18 ', pcvStatsAfter.userCirculatingFei.sub(pcvStatsBefore.userCirculatingFei) / 1e24);
  console.log('Equity diff [M]e18   ', pcvStatsAfter.protocolEquity.sub(pcvStatsBefore.protocolEquity) / 1e24);
  console.log('----------------------------------------------------');
  console.log('Removed PCV Deposit resistant balance :');
  console.log(
    'rariPool8FeiPCVDepositWrapper [M]e18  ',
    (await contracts.rariPool8FeiPCVDepositWrapper.resistantBalanceAndFei())[0] / 1e24
  );
  console.log(
    'rariPool8DaiPCVDeposit [M]e18         ',
    (await contracts.rariPool8DaiPCVDeposit.resistantBalanceAndFei())[0] / 1e24
  );
  console.log(
    'rariPool8LusdPCVDeposit [M]e18        ',
    (await contracts.rariPool8LusdPCVDeposit.resistantBalanceAndFei())[0] / 1e24
  );
  console.log(
    'rariPool18FeiPCVDepositWrapper [M]e18 ',
    (await contracts.rariPool18FeiPCVDepositWrapper.resistantBalanceAndFei())[0] / 1e24
  );
  console.log(
    'rariPool27FeiPCVDepositWrapper [M]e18 ',
    (await contracts.rariPool27FeiPCVDepositWrapper.resistantBalanceAndFei())[0] / 1e24
  );
  console.log(
    'rariPool146EthPCVDeposit [M]e18       ',
    ((await contracts.rariPool146EthPCVDeposit.resistantBalanceAndFei())[0] * 3000) / 1e24
  );
  console.log(
    'convexPoolPCVDepositWrapper [M]e18    ',
    (await contracts.convexPoolPCVDepositWrapper.resistantBalanceAndFei())[0] / 1e24
  );
  console.log('----------------------------------------------------');
  console.log('Removed PCV Deposit resistant fei :');
  console.log(
    'rariPool8FeiPCVDepositWrapper [M]e18  ',
    (await contracts.rariPool8FeiPCVDepositWrapper.resistantBalanceAndFei())[1] / 1e24
  );
  console.log(
    'rariPool8DaiPCVDeposit [M]e18         ',
    (await contracts.rariPool8DaiPCVDeposit.resistantBalanceAndFei())[1] / 1e24
  );
  console.log(
    'rariPool8LusdPCVDeposit [M]e18        ',
    (await contracts.rariPool8LusdPCVDeposit.resistantBalanceAndFei())[1] / 1e24
  );
  console.log(
    'rariPool18FeiPCVDepositWrapper [M]e18 ',
    (await contracts.rariPool18FeiPCVDepositWrapper.resistantBalanceAndFei())[1] / 1e24
  );
  console.log(
    'rariPool27FeiPCVDepositWrapper [M]e18 ',
    (await contracts.rariPool27FeiPCVDepositWrapper.resistantBalanceAndFei())[1] / 1e24
  );
  console.log(
    'rariPool146EthPCVDeposit [M]e18       ',
    (await contracts.rariPool146EthPCVDeposit.resistantBalanceAndFei())[1] / 1e24
  );
  console.log(
    'convexPoolPCVDepositWrapper [M]e18    ',
    (await contracts.convexPoolPCVDepositWrapper.resistantBalanceAndFei())[1] / 1e24
  );
  console.log('----------------------------------------------------');
  console.log(
    'old lens balance [M]e18  ',
    ((await contracts.balancerLensBpt30Fei70Weth.resistantBalanceAndFei())[0] * 3000) / 1e24
  );
  console.log(
    'old lens fei     [M]e18  ',
    (await contracts.balancerLensBpt30Fei70Weth.resistantBalanceAndFei())[1] / 1e24
  );
  console.log(
    'new lens balance [M]e18  ',
    ((await contracts.balancerLensBpt30Fei70WethFixed.resistantBalanceAndFei())[0] * 3000) / 1e24
  );
  console.log(
    'new lens fei     [M]e18  ',
    (await contracts.balancerLensBpt30Fei70WethFixed.resistantBalanceAndFei())[1] / 1e24
  );

  // Check the lens swap
};

export { deploy, setup, teardown, validate };
