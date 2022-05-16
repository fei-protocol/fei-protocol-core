import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';

const fipNumber = 'Liquidate CREAM position';
/*

Liquidate CREAM

Description: Sell all CREAM for ETH by slowly selling it over a period of time on Sushiswap
*/
const swapFrequency = 1000;

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const pcvSwapperUniswapFactory = await ethers.getContractFactory('PCVSwapperUniswap');
  const pcvSwapperUniswap = await pcvSwapperUniswapFactory.deploy(
    addresses.core,
    addresses.sushiswapCreamWethPair,
    addresses.chainlinkCREAMEthOracle, // Oracle
    swapFrequency, // default minimum interval between swaps
    addresses.cream, // tokenSpent
    addresses.weth, // tokenReceived
    addresses.feiDAOTimelock, // tokenReceivingAddress
    ethers.constants.WeiPerEther.mul('100'), // maxSpentPerSwap
    ethers.constants.WeiPerEther.mul('300'), // maximumSlippageBasisPoints, 3%
    false, // invertOraclePrice
    ethers.constants.WeiPerEther.mul('200') // swap incentive = 200 FEI. Noop, not granting MINTER role
  );
  await pcvSwapperUniswap.deployTransaction.wait();

  logging && console.log('Deployed PCVSwapperUniswap at:', pcvSwapperUniswap.address);
  return {
    pcvSwapperUniswap
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
  // 1. Validate configuration of swapper
  // 2. Validate swapper received funds
  // 3. Fast forward time and validate that a swap can be performed
  // 4. At end, can withdraw the ETH from the contract
};

export { deploy, setup, teardown, validate };
