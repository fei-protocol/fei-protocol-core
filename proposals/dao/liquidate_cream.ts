import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { time } from '@test/helpers';

const fipNumber = 'Liquidate CREAM position';

const toBN = ethers.BigNumber.from;
/*

Liquidate CREAM

Description: Liquidate all CREAM for ETH by slowly selling it over a period of time on Sushiswap

Sushiswap is the DEX with most CREAM liquidity. The CREAM-WETH pair has 24hr volume of ~$50k.

This proposal will sell ~$5k of CREAM (~250 tokens at $20 per token) every 30minutes.
This will incur slippage of ~2% on each sale. 

The protocol has ~$600k CREAM to liquidate. At a rate of $5k per 30mins ($24k per day), this will take ~25 days. 
*/
const swapFrequency = (60 * 30).toString(); // 1800 seconds, 30mins
const maxSpentPerSwap = ethers.constants.WeiPerEther.mul('250'); // 250 tokens
const maxSlippageBasisPoints = '300'; // 3%
const protocolCreamBalance = toBN('31780370000000000000000'); // Total num CREAM tokens: 31,780

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const pcvSwapperUniswapFactory = await ethers.getContractFactory('PCVSwapperUniswap');
  const creamSushiswapSwapper = await pcvSwapperUniswapFactory.deploy(
    addresses.core,
    addresses.sushiswapCreamWethPair,
    addresses.chainlinkCREAMEthOracle, // Oracle
    addresses.weth,
    swapFrequency, // default minimum interval between swaps
    addresses.cream, // tokenSpent
    addresses.weth, // tokenReceived
    addresses.aaveEthPCVDepositWrapper, // tokenReceivingAddress. Aave ETH deposit underlying is WETH
    maxSpentPerSwap, // maximum number of tokens spent per swap
    maxSlippageBasisPoints, // maximumSlippageBasisPoints, 3%
    false, // invertOraclePrice
    ethers.constants.WeiPerEther.mul('200') // swap incentive = 200 FEI. Noop, not granting MINTER role
  );
  await creamSushiswapSwapper.deployTransaction.wait();

  logging && console.log('Deployed PCVSwapperUniswap at:', creamSushiswapSwapper.address);
  return {
    creamSushiswapSwapper
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
  // 0. Validate price reported by chainlink oracle
  const chainlinkCreamEthOracle = contracts.chainlinkCREAMEthOracle;
  const price = (await chainlinkCreamEthOracle.read())[0];
  logging && console.log('Cream price in terms of ETH: ', price.toString());

  // 1. Validate configuration of swapper
  const creamSwapper = contracts.creamSushiswapSwapper;
  expect(await creamSwapper.tokenSpent()).to.equal(addresses.cream);
  expect(await creamSwapper.tokenReceived()).to.equal(addresses.weth);
  expect(await creamSwapper.maxSpentPerSwap()).to.equal(maxSpentPerSwap);
  expect(await creamSwapper.maximumSlippageBasisPoints()).to.equal(maxSlippageBasisPoints);

  // 2. Validate swapper received funds
  const initialSwapperCreamBalance = await contracts.cream.balanceOf(creamSwapper.address);
  expect(initialSwapperCreamBalance).to.be.equal(protocolCreamBalance);

  const initialPCVDepositWethBalance = await contracts.weth.balanceOf(addresses.aaveEthPCVDepositWrapper);
  const expectedToSell = await creamSwapper.getNextAmountSpent();
  const expectedToReceive = await creamSwapper.getNextAmountReceived();

  // 3. Fast forward time past threshold and validate that a swap can be performed
  await time.increase(swapFrequency);
  await creamSwapper.swap();

  // Validate swapped balance
  const newCreamBalance = await contracts.cream.balanceOf(creamSwapper.address);
  expect(newCreamBalance).to.be.bignumber.equal(initialSwapperCreamBalance.sub(expectedToSell));

  const newWethBalance = await contracts.weth.balanceOf(addresses.aaveEthPCVDepositWrapper);
  expect(newWethBalance).to.be.bignumber.equal(initialPCVDepositWethBalance.add(expectedToReceive));

  // Sanity check the amount of ETH received in the trade
  // 1 CREAM token ~= $20
  // 1 ETH ~= $2000
  // For 250 CREAM tokens ($5000), expect ~2 eth
  const amountReceived = newWethBalance - initialPCVDepositWethBalance;
  expect(amountReceived.toString()).to.be.at.most(ethers.utils.parseEther('2.5'));
  expect(amountReceived.toString()).to.be.at.least(ethers.utils.parseEther('1.5'));

  // Validate a second swap can occur
  await time.increase(swapFrequency);
  await creamSwapper.swap();
};

export { deploy, setup, teardown, validate };
