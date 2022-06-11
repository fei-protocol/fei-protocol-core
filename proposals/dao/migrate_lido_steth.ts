import hre, { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, time, overwriteChainlinkAggregator, ZERO_ADDRESS } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

let pcvStatsBefore;

const fipNumber = 'migrate_lido_steth';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Deposit stETH oracle
  const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const stethChainlinkOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    '0xCfE54B5cD566aB89272946F602D76Ea879CAb4a8'
  );
  await stethChainlinkOracleWrapper.deployed();
  logging && console.log(`stethChainlinkOracleWrapper: ${stethChainlinkOracleWrapper}`);

  // Deploy new PCVDeposit
  const ethLidoPCVDepositFactory = await ethers.getContractFactory('EthLidoPCVDeposit');
  const ethLidoPCVDeposit = await ethLidoPCVDepositFactory.deploy(
    addresses.core,
    [
      stethChainlinkOracleWrapper.address,
      ZERO_ADDRESS,
      false, // invert
      0 // decimals normalizer
    ],
    addresses.steth,
    addresses.curveStethPool,
    '100' // max 1% slippage
  );
  await ethLidoPCVDeposit.deployTransaction.wait();
  logging && console.log('ethLidoPCVDeposit: ', ethLidoPCVDeposit.address);

  return {
    stethChainlinkOracleWrapper,
    ethLidoPCVDeposit
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // make sure TC has enough ETH to run
  await forceEth(addresses.tribalCouncilSafe);
  await forceEth(addresses.tribalCouncilTimelock);

  // make sure ETH oracle is fresh (for B.AMM not to revert, etc)
  // Read Chainlink ETHUSD price & override chainlink storage to make it a fresh value
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0].toString() / 1e10;
  await overwriteChainlinkAggregator(addresses.chainlinkEthUsdOracle, Math.round(ethPrice), '8');

  // read pcvStats before proposal execution
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
  // TODO : check the stETH oracle price
  // TODO : check the token movements
  // TODO : check the new contract's state
  // TODO : check the withdrawal from steth PCVDeposit
  // TODO : check the withdrawal from balancer fei/weth pool

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
