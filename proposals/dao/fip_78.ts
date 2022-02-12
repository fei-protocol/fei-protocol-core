import { ethers } from 'hardhat';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

import { daiUsdcBackupOracleConfig, ethUsdcBackupOracleConfig } from '@protocol/backupOracleConfig';

/*

FIP-78

OA Steps:
1. Deploy DAI-USDC UniswapV3 TWAP oracle 
2. Deploy ETH-USDC UniswapV3 TWAP oracle
3. Set backupOracle on DAI PSM to DAI-USDC UniswapV3 TWAP oracle
3. Set backupOracle on ETH PSM to ETH-USDC UniswapV3 TWAP oracle

*/
const fipNumber = '78';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const uniswapWrapperFactory = await ethers.getContractFactory('UniswapWrapper');
  const uniswapWrapper = await uniswapWrapperFactory.deploy();
  await uniswapWrapper.deployTransaction.wait();
  logging && console.log('uniswapWrapper:', uniswapWrapper.address);

  const uniswapV3TwapOracleFactory = await ethers.getContractFactory('UniswapV3OracleWrapper');

  const daiUsdcTwapOracle = await uniswapV3TwapOracleFactory.deploy(
    addresses.core,
    addresses.dai,
    addresses.usdc,
    uniswapWrapper.address,
    daiUsdcBackupOracleConfig as any
  );
  logging && console.log('daiUsdcTwapOracle:', daiUsdcTwapOracle.address);

  const ethUsdcTwapOracle = await uniswapV3TwapOracleFactory.deploy(
    addresses.core,
    addresses.weth,
    addresses.usdc,
    uniswapWrapper.address,
    ethUsdcBackupOracleConfig as any
  );

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
};

export { deploy, setup, teardown, validate };
