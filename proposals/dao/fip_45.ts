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
import { expectApproxAbs, getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

chai.use(CBN(ethers.BigNumber));

/*

// Angle Protocol Partnership

DEPLOY ACTIONS:

1. Deploy EURUSD Oracle
2. Deploy agEUR Uniswap PCVDeposit

DAO ACTIONS:
1. Make the agEUR Uniswap PCVDeposit a Minter
2. Mint agEUR using the 10M FEI
3. Deposit agEUR & matching minted FEI on Uniswap
4. and 5. Update Collateralization Oracle with the new token & deposit
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
  // Prepare to impersonate for some Angle protocol calls
  const ANGLE_MULTISIG_ADDRESS = '0x0C2553e4B9dFA9f83b1A6D3EAB96c4bAaB42d430';
  await forceEth(ANGLE_MULTISIG_ADDRESS);
  const angleMultisigSigner = await getImpersonatedSigner(ANGLE_MULTISIG_ADDRESS);
  // Unpause the FEI-agEUR contract
  /*await contracts.angleStableMaster
    .connect(angleMultisigSigner)
    .unpause(ethers.utils.keccak256(ethers.utils.toUtf8Bytes('STABLE')), contracts.anglePoolManager.address);*/
  // Prevent the oracle from being expired
  // This is because on a local mainnet fork, time is not accurate and Angle Protocol
  // considers their oracles expired otherwise.
  const oracleAbi = ['function changeStalePeriod(uint32 _stalePeriod)'];
  const oracleInterface = new ethers.utils.Interface(oracleAbi);
  const encodeOracleCall = oracleInterface.encodeFunctionData('changeStalePeriod', ['1000000000']);
  await (
    await angleMultisigSigner.sendTransaction({
      data: encodeOracleCall,
      to: '0x236D9032d96226b900B0D557Ae6Fd202f3a26b6a'
    })
  ).wait();
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-45');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { chainlinkEurUsdOracleWrapper, agEurAngleUniswapPCVDeposit, collateralizationOracle } = contracts;

  const price = (await chainlinkEurUsdOracleWrapper.read())[0];
  // expect USDEUR price ~1.11-1.15
  expectApproxAbs(price.toString(), '1130000000000000000', '20000000000000000');

  // deposit balance & fei held
  const balanceAndFei = await agEurAngleUniswapPCVDeposit.resistantBalanceAndFei();
  // expect 8.7-9.0M agEUR to be minted
  expectApproxAbs(balanceAndFei[0].toString(), '8850000000000000000000000', '150000000000000000000000');
  // expect 9.8M+ FEI held by the contract
  expectApproxAbs(balanceAndFei[1].toString(), '10000000000000000000000000', '200000000000000000000000');

  // farming staking rewards
  await agEurAngleUniswapPCVDeposit.claimRewards();
  const angleBalance = await contracts.angle.balanceOf(contracts.agEurAngleUniswapPCVDeposit.address);
  expect(angleBalance.toString() > 0).to.be.true;

  // CR Oracle updates
  expect(await collateralizationOracle.tokenToOracle(addresses.agEUR)).to.be.equal(
    chainlinkEurUsdOracleWrapper.address
  );
  expect(await collateralizationOracle.depositToToken(contracts.agEurAngleUniswapPCVDeposit.address)).to.be.equal(
    addresses.agEUR
  );
};
