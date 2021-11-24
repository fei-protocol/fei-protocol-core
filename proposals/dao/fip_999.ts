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
import { expectApprox } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  if (!addresses.core) {
    console.log(`core: ${addresses.core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create Chainlink Oracle Wrapper for BAL/USD feed
  const chainlinkOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkBalEthOracleWrapper = await chainlinkOracleWrapperFactory.deploy(
    addresses.core,
    addresses.chainlinkBalEthOracle
  );
  await chainlinkBalEthOracleWrapper.deployTransaction.wait();

  logging && console.log('Chainlink BALETH Oracle Wrapper:', chainlinkBalEthOracleWrapper.address);

  // Create a composite oracle from BAL/ETH and ETH/USD to get BAL/USD
  const compositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const compositeOracleBalUsd = await compositeOracleFactory.deploy(
    addresses.core,
    chainlinkBalEthOracleWrapper.address,
    addresses.chainlinkEthUsdOracleWrapper
  );
  await compositeOracleBalUsd.deployTransaction.wait();

  logging && console.log('Chainlink BALUSD Composite Oracle Wrapper:', compositeOracleBalUsd.address);

  // Create a new Balancer deposit for the BAL/ETH pool
  const balancerDepositPoolTwoFactory = await ethers.getContractFactory('BalancerPCVDepositPoolTwo');
  const balancerDepositBalEth = await balancerDepositPoolTwoFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
    '300', // max 3% slippage
    '0xba100000625a3754423978a60c9317c58a424e3D', // BAL token
    compositeOracleBalUsd.address,
    addresses.chainlinkEthUsdOracleWrapper
  );
  await balancerDepositBalEth.deployTransaction.wait();

  logging && console.log('Balancer BAL/USD deposit:', balancerDepositBalEth.address);

  return {
    chainlinkBalEthOracleWrapper,
    compositeOracleBalUsd,
    balancerDepositBalEth
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-999');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-999');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // No more BAL on the timelock
  expect(await contracts.bal.balanceOf(contracts.feiDAOTimelock.address)).to.be.equal('0');

  // Expect BAL to be moved to the new deposit.
  // The amount accounts for the ETH deposited in addition to the BAL
  // Should be between [240k, 260k].
  expectApprox(await contracts.balancerDepositBalEth.balance(), '250000000000000000000000', '10000000000000000000000');

  // CR Oracle updates
  expect(await contracts.collateralizationOracle.tokenToOracle(addresses.bal)).to.be.equal(
    contracts.compositeOracleBalUsd.address
  );
  expect(await contracts.collateralizationOracle.depositToToken(contracts.balancerDepositBalEth.address)).to.be.equal(
    addresses.bal
  );

  // Dummy script to test other functions on a local fork
  console.log('done validate');
  console.log('  BALETH oracle value', (await contracts.chainlinkBalEthOracleWrapper.read())[0] / 1e18);
  console.log('  BALUSD oracle value', (await contracts.compositeOracleBalUsd.read())[0] / 1e18);
  console.log('  timelock BAL balance', (await contracts.bal.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  balance() ?', (await contracts.balancerDepositBalEth.balance()) / 1e18);
  console.log('  withdraw(10000) BAL to Timelock');
  await contracts.balancerDepositBalEth.withdraw(addresses.feiDAOTimelock, '10000000000000000000000');
  console.log('  timelock BAL balance', (await contracts.bal.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  balance() ?', (await contracts.balancerDepositBalEth.balance()) / 1e18);
  console.log('  exitPool(addresses.feiDAOTimelock)');
  await contracts.balancerDepositBalEth.exitPool(addresses.feiDAOTimelock);
  console.log('  balance() ?', (await contracts.balancerDepositBalEth.balance()) / 1e18);
  console.log('  feiDAOTimelock BAL balance', (await contracts.bal.balanceOf(addresses.feiDAOTimelock)) / 1e18);
  console.log('  feiDAOTimelock WETH balance', (await contracts.wethERC20.balanceOf(addresses.feiDAOTimelock)) / 1e18);
};
