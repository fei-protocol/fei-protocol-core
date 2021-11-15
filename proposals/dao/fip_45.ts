import { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import {
  DeployUpgradeFunc,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '../../types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { expectApprox } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

/*

// Angle Protocol Partnership

DEPLOY ACTIONS:

1. Deploy EURUSD Oracle
2. Deploy agEUR Uniswap PCVDeposit

DAO ACTIONS:
1. Mint 10M FEI to be converted to agEUR
2. Mint agEUR using the 10M FEI
3. Make the agEUR Uniswap PCVDeposit a Minter
4. Deposit agEUR & matching minted FEI on Uniswap
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  if (!addresses.core) {
    console.log(`core: ${addresses.core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create Chainlink Oracle Wrapper for EUR/USD feed
  const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkEurUsdOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    addresses.chainlinkEurUsdOracle
  );
  await chainlinkEurUsdOracleWrapper.deployTransaction.wait();

  logging && console.log('Chainlink EUR/USD Oracle Wrapper:', chainlinkEurUsdOracleWrapper.address);

  // Create agEUR-FEI Uniswap PCVDeposit
  const angleUniswapPCVDepositFactory = await ethers.getContractFactory('AngleUniswapPCVDeposit');
  const agEurAngleUniswapPCVDeposit = await angleUniswapPCVDepositFactory.deploy(
    addresses.core,
    addresses.angleAgEurFeiPool, // Uniswap-v2 agEUR/FEI pool
    addresses.uniswapRouter, // UNiswap-v2 router
    chainlinkEurUsdOracleWrapper.address,
    ethers.constants.AddressZero,
    '100', // max. 1% slippage
    addresses.angleStableMaster,
    addresses.anglePoolManager,
    addresses.angleStakingRewards
  );
  await agEurAngleUniswapPCVDeposit.deployTransaction.wait();

  logging && console.log('Angle agEUR/FEI Uniswap PCVDeposit:', agEurAngleUniswapPCVDeposit.address);

  return {
    agEurAngleUniswapPCVDeposit,
    chainlinkEurUsdOracleWrapper
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-45');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-45');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { chainlinkEurUsdOracleWrapper, agEurAngleUniswapPCVDeposit, collateralizationOracle } = contracts;

  const price = (await chainlinkEurUsdOracleWrapper.readOracle())[0];
  //expect(price).to.be.equal(ethers.constants.WeiPerEther.mul(1));
  console.log('oracle price', price.toString());

  // deposit balance & fei held
  const balanceAndFei = await agEurAngleUniswapPCVDeposit.resistantBalanceAndFei();
  console.log('balanceAndFei[0].toString()', balanceAndFei[0].toString());
  console.log('balanceAndFei[1].toString()', balanceAndFei[1].toString());

  // farming staking rewards
  await agEurAngleUniswapPCVDeposit.claimRewards();
  const angleBalance = await contracts.angle.balanceOf(contracts.agEurAngleUniswapPCVDeposit.address);
  console.log('angleBalance.toString()', angleBalance.toString());

  // CR Oracle updates
  expect(await collateralizationOracle.tokenToOracle(addresses.agEUR)).to.be.equal(
    chainlinkEurUsdOracleWrapper.address
  );
  expect(await collateralizationOracle.depositToToken(contracts.agEurAngleUniswapPCVDeposit.address)).to.be.equal(
    addresses.agEUR
  );

  // TODO, implement proper invariant checks
  expect(false).to.equal(true);
};
