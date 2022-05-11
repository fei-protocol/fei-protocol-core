import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { Contract } from 'ethers';
import { ZERO_ADDRESS, overwriteChainlinkAggregator } from '@test/helpers';

const fipNumber = 'accounting';
let pcvStatsBefore;

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const balancerWeightedPoolOracleFactory = await ethers.getContractFactory('BalancerWeightedPoolOracle');
  const balancerWeightedPoolOracleFeiWeth = await balancerWeightedPoolOracleFactory.deploy(
    addresses.balancerFeiWethPool,
    [
      addresses.oneConstantOracle, // FEI oracle
      addresses.chainlinkEthUsdOracleWrapper // WETH oracle
    ]
  );
  logging && console.log('balancerWeightedPoolOracleFeiWeth: ', balancerWeightedPoolOracleFeiWeth.address);

  const curvePoolOracleFactory = await ethers.getContractFactory('CurvePoolOracle');
  const curvePoolOracleD3 = await curvePoolOracleFactory.deploy(
    addresses.curveD3pool, // pool to get virtual price from
    addresses.oneConstantOracle // oracle price for USD stablecoins
  );
  logging && console.log('curvePoolOracleD3: ', curvePoolOracleD3.address);

  const convexPCVDepositFactory = await ethers.getContractFactory('ConvexPCVDeposit');
  const convexPCVDepositD3 = await convexPCVDepositFactory.deploy(
    addresses.core,
    addresses.curveD3pool,
    addresses.convexBooster,
    addresses.convexD3poolRewards
  );
  logging && console.log('convexPCVDepositD3: ', convexPCVDepositD3.address);

  const curvePCVDepositPlainPoolFactory = await ethers.getContractFactory('CurvePCVDepositPlainPool');
  const curvePCVDepositPlainPoolD3 = await curvePCVDepositPlainPoolFactory.deploy(
    addresses.core,
    addresses.curveD3pool,
    '50' // max 0.5% slippage
  );
  logging && console.log('curvePCVDepositPlainPoolD3: ', curvePCVDepositPlainPoolD3.address);

  return {
    balancerWeightedPoolOracleFeiWeth,
    curvePoolOracleD3,
    curvePCVDepositPlainPoolD3,
    convexPCVDepositD3
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
  // assert removals from CR oracle
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerLensBpt30Fei70Weth)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.d3poolConvexPCVDeposit)).to.be.equal(
    ZERO_ADDRESS
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.d3poolCurvePCVDeposit)).to.be.equal(
    ZERO_ADDRESS
  );

  // assert additions in CR oracle
  expect(await contracts.collateralizationOracle.depositToToken(addresses.gaugeLensBpt30Fei70WethGauge)).to.be.equal(
    addresses.balancerFeiWethPool
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.curvePCVDepositPlainPoolD3)).to.be.equal(
    addresses.curveD3pool
  );
  expect(await contracts.collateralizationOracle.depositToToken(addresses.convexPCVDepositD3)).to.be.equal(
    addresses.curveD3pool
  );

  // read FEI/WETH BPT Oracle
  console.log('----------------------------------------------------');
  const feiWethOracleRead = await contracts.balancerWeightedPoolOracleFeiWeth.read();
  console.log('balancerWeightedPoolOracleFeiWeth.read()[0]/1e18', feiWethOracleRead[0] / 1e18);
  console.log('balancerWeightedPoolOracleFeiWeth.read()[1]', feiWethOracleRead[1]);

  // read D3 Oracle
  console.log('----------------------------------------------------');
  const d3OracleRead = await contracts.curvePoolOracleD3.read();
  console.log('d3OracleRead.read()[0]/1e18', d3OracleRead[0] / 1e18);
  console.log('d3OracleRead.read()[1]', d3OracleRead[1]);

  // read D3 deposit balances
  console.log('----------------------------------------------------');
  console.log(
    'curvePCVDepositPlainPoolD3.balance()/1e18',
    (await contracts.curvePCVDepositPlainPoolD3.balance()) / 1e18
  );
  console.log('convexPCVDepositD3.balance()/1e18', (await contracts.convexPCVDepositD3.balance()) / 1e18);

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
