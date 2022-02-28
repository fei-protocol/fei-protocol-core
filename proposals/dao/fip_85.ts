import { ethers } from 'hardhat';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

import { daiUsdcBackupOracleConfig, ethUsdcBackupOracleConfig } from '@protocol/backupOracleConfig';
import { expect } from 'chai';

const e18 = '000000000000000000';
const e17 = '00000000000000000';
/*

FIP-85

Steps:
1. Deploy DAI-USDC UniswapV3 TWAP oracle 
2. Deploy ETH-USDC UniswapV3 TWAP oracle
3. Set backupOracle on DAI PSM to DAI-USDC UniswapV3 TWAP oracle
3. Set backupOracle on ETH PSM to ETH-USDC UniswapV3 TWAP oracle

*/
const fipNumber = '85';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  logging && console.log('Deploying Uniswap wrapper...');
  const uniswapWrapperFactory = await ethers.getContractFactory('UniswapWrapper');
  const uniswapWrapper = await uniswapWrapperFactory.deploy();
  await uniswapWrapper.deployTransaction.wait();
  logging && console.log('uniswapWrapper address:', uniswapWrapper.address);
  const uniswapV3TwapOracleFactory = await ethers.getContractFactory('UniswapV3OracleWrapper');

  logging && console.log('Deploying DAI:USDC TWAP oracle...');
  const daiUsdcTwapOracle = await uniswapV3TwapOracleFactory.deploy(
    addresses.core,
    addresses.dai,
    addresses.usdc,
    uniswapWrapper.address,
    daiUsdcBackupOracleConfig as any
  );
  await daiUsdcTwapOracle.deployTransaction.wait();

  logging && console.log('daiUsdcTwapOracle:', daiUsdcTwapOracle.address);

  console.log('Deploying ETH:USDC TWAP oracle...');
  const ethUsdcTwapOracle = await uniswapV3TwapOracleFactory.deploy(
    addresses.core,
    addresses.weth,
    addresses.usdc,
    uniswapWrapper.address,
    ethUsdcBackupOracleConfig as any
  );
  await ethUsdcTwapOracle.deployTransaction.wait();

  logging && console.log('ethUsdcTwapOracle:', ethUsdcTwapOracle.address);

  return {
    uniswapWrapper,
    daiUsdcTwapOracle,
    ethUsdcTwapOracle
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
  console.log(`Validate logic is in the integration test for fip${fipNumber}`);
  const daiUsdcTwapOracle = contracts.daiUsdcTwapOracle;
  const ethUsdcTwapOracle = contracts.ethUsdcTwapOracle;

  // 1. Validate that backupOracles have been set
  const daiPSM = contracts.daiFixedPricePSM;
  const daiBackupOracle = await daiPSM.backupOracle();
  expect(daiBackupOracle).to.equal(daiUsdcTwapOracle.address);

  const ethPSM = contracts.ethPSM;
  const ethBackupOracle = await ethPSM.backupOracle();
  expect(ethBackupOracle).to.equal(ethUsdcTwapOracle.address);

  // 2. Validate that a valid `read()` can be fetched from the oracles
  const [daiPrice, daiPriceValid] = await daiUsdcTwapOracle.read();
  expect(daiPriceValid).to.equal(true);
  expect(daiPrice.value).to.be.bignumber.greaterThan(ethers.BigNumber.from(`8${e17}`)); // 0.8
  expect(daiPrice.value).to.be.bignumber.lessThan(ethers.BigNumber.from(`12${e17}`)); // 1.2

  const [ethPrice, ethPriceValid] = await ethUsdcTwapOracle.read();
  expect(ethPriceValid).to.equal(true);
  expect(ethPrice.value).to.be.bignumber.greaterThan(ethers.BigNumber.from(`500${e18}`)); // 500
  expect(ethPrice.value).to.be.bignumber.lessThan(ethers.BigNumber.from(`10000${e18}`)); // 10,000
};

export { deploy, setup, teardown, validate };
