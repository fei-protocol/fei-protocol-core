import { ethers } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { getImpersonatedSigner, time } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

const fipNumber = 'Liquidate CREAM position';

const toBN = ethers.BigNumber.from;
/*

Liquidate CREAM

Description: Sell all CREAM for ETH by slowly selling it over a period of time on Sushiswap
*/
const swapFrequency = '1000'; // 1000 seconds, 16mins
const maxSpentPerSwap = ethers.constants.WeiPerEther.mul('2000'); // 2000 tokens
const maxSlippageBasisPoints = ethers.constants.WeiPerEther.mul('300'); // 3%
const protocolCreamBalance = toBN(31780370000000000000000); // Total num CREAM tokens: 31,780

const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  const pcvSwapperUniswapFactory = await ethers.getContractFactory('PCVSwapperUniswap');
  const creamSushiswapSwapper = await pcvSwapperUniswapFactory.deploy(
    addresses.core,
    addresses.sushiswapCreamWethPair,
    addresses.weth,
    addresses.chainlinkCREAMEthOracle, // Oracle
    swapFrequency, // default minimum interval between swaps
    addresses.cream, // tokenSpent
    addresses.weth, // tokenReceived
    addresses.feiDAOTimelock, // tokenReceivingAddress
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
  // 1. Validate configuration of swapper
  const creamSwapper = contracts.creamSushiswapSwapper;
  expect(await creamSwapper.tokenSpent()).to.equal(addresses.cream);
  expect(await creamSwapper.tokenReceived()).to.equal(addresses.weth);
  expect(await creamSwapper.maxSpentPerSwap()).to.equal(maxSpentPerSwap);
  expect(await creamSwapper.maximumSlippageBasisPoints()).to.equal(maxSlippageBasisPoints);

  // 2. Validate swapper received funds
  const swapperCreamBalance = await contracts.cream.balanceOf(creamSwapper.address);
  expect(swapperCreamBalance).to.be.equal(protocolCreamBalance);

  const swapperWethBalance = await contracts.cream.balanceOf(creamSwapper.address);
  expect(swapperWethBalance).to.be.bignumber.equal(toBN(0));

  // 3. Fast forward time past threshold and validate that a swap can be performed
  await time.increase(swapFrequency);
  await creamSwapper.swap();

  // Validate swapped balances
  const newCreamBalance = await contracts.cream.balanceOf(creamSwapper.address);
  expect(newCreamBalance).to.be.bignumber.equal(swapperCreamBalance.add());
  const newWethBalance = await contracts.weth.balanceOf(creamSwapper.address);
  expect(newWethBalance).to.be.bignumber.equal(newWethBalance.add());

  // 4. Withdraw swapped WETH from contract to Timelock
  const tribalCouncilSigner = await getImpersonatedSigner(addresses.tribalCouncilTimelock);
  await forceEth(addresses.tribalCouncilTimelock);
  await creamSwapper
    .connect(tribalCouncilSigner)
    .withdrawERC20(addresses.tribalCouncilTimelock, addresses.weth, newWethBalance);

  expect(await contracts.weth.balanceOf(addresses.tribalCouncilTimelock)).to.be.bignumber.equal(newWethBalance);
};

export { deploy, setup, teardown, validate };
