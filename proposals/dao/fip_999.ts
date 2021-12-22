import hre, { ethers, artifacts } from 'hardhat';
import { expect } from 'chai';
import {
  DeployUpgradeFunc,
  NamedAddresses,
  NamedContracts,
  SetupUpgradeFunc,
  TeardownUpgradeFunc,
  ValidateUpgradeFunc
} from '@custom-types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { getImpersonatedSigner } from '@test/helpers';
import { forceEth } from '@test/integration/setup/utils';

/*

DAO Proposal FIP-999

Description:

Steps:
  1 -
  2 -
  3 -

*/

const fipNumber = '999';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Create a new Balancer deposit for the BAL/WETH pool
  const balancerDepositWeightedPoolFactory = await ethers.getContractFactory('BalancerPCVDepositWeightedPool');
  const balancerDepositBalWeth = await balancerDepositWeightedPoolFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    '0x5c6ee304399dbdb9c8ef030ab642b10820db8f56000200000000000000000014', // poolId
    '100', // max 1% slippage
    '0xba100000625a3754423978a60c9317c58a424e3D', // BAL token
    [addresses.balUsdCompositeOracle, addresses.chainlinkEthUsdOracleWrapper]
  );
  await balancerDepositBalWeth.deployTransaction.wait();

  logging && console.log('Balancer BAL/WETH deposit :', balancerDepositBalWeth.address);

  // Create a pool owner implementation
  const balancerPoolOwnerImplementationFactory = await ethers.getContractFactory('BalancerPoolOwner');
  const balancerPoolOwnerImplementation = await balancerPoolOwnerImplementationFactory.deploy(addresses.core);
  await balancerPoolOwnerImplementation.deployTransaction.wait();

  logging && console.log('Balancer Pool Owner Implementation :', balancerPoolOwnerImplementation.address);

  // Create a proxy for pool ownership
  const ProxyFactory = await ethers.getContractFactory('TransparentUpgradeableProxy');
  const calldata = balancerPoolOwnerImplementation.interface.encodeFunctionData('initialize', [addresses.core]);
  const proxy = await ProxyFactory.deploy(balancerPoolOwnerImplementation.address, addresses.proxyAdmin, calldata);
  await proxy.deployTransaction.wait();

  const balancerPoolOwnerProxy = await ethers.getContractAt('BalancerPoolOwner', proxy.address);

  logging && console.log('Balancer Pool Owner Proxy :', balancerPoolOwnerProxy.address);

  // Create a new TRIBE/WETH pool
  const weightedPoolTwoTokensFactory = await ethers.getContractAt(
    'IWeightedPool2TokensFactory',
    addresses.balancerWeightedPoolFactory
  );
  const tx: TransactionResponse = await weightedPoolTwoTokensFactory.create(
    'Balancer 80 TRIBE 20 WETH',
    'B-80TRIBE-20WETH',
    [addresses.wethERC20, addresses.tribe],
    [ethers.constants.WeiPerEther.mul(20).div(100), ethers.constants.WeiPerEther.mul(80).div(100)], // 80% TRIBE 20% WETH
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    true, // oracleEnabled
    balancerPoolOwnerProxy.address
  );
  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const balancerTribeWethPool = await ethers.getContractAt('IWeightedPool', rawLogs[0].address);
  logging && console.log('Balancer 80% TRIBE / 20% WETH Pool :', balancerTribeWethPool.address);

  // Create a new WETH/FEI pool
  const tx2: TransactionResponse = await weightedPoolTwoTokensFactory.create(
    'Balancer 70 WETH 30 FEI',
    'B-70WETH-30FEI',
    [addresses.fei, addresses.wethERC20],
    [ethers.constants.WeiPerEther.mul(30).div(100), ethers.constants.WeiPerEther.mul(70).div(100)], // 70% WETH 30% FEI
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    true, // oracleEnabled
    balancerPoolOwnerProxy.address
  );
  const txReceipt2 = await tx.wait();
  const { logs: rawLogs2 } = txReceipt2;
  const balancerWethFeiPool = await ethers.getContractAt('IWeightedPool', rawLogs2[0].address);
  logging && console.log('Balancer 70% WETH / 30% FEI Pool :', balancerWethFeiPool.address);

  // Create a new Balancer deposit for the TRIBE/WETH pool
  const balancerDepositTribeWeth = await balancerDepositWeightedPoolFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    await balancerTribeWethPool.getPoolId(), // poolId
    '100', // max 1% slippage
    addresses.wethERC20, // accounting in WETH
    [addresses.chainlinkEthUsdOracleWrapper, addresses.tribeUsdCompositeOracle]
  );
  await balancerDepositTribeWeth.deployTransaction.wait();

  logging && console.log('Balancer TRIBE/WETH deposit :', balancerDepositTribeWeth.address);

  // Create a new Balancer deposit for the BAL/WETH pool
  const balancerDepositWethFei = await balancerDepositWeightedPoolFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    await balancerWethFeiPool.getPoolId(), // poolId
    '100', // max 1% slippage
    addresses.wethERC20, // accounting in WETH
    [addresses.oneConstantOracle, addresses.chainlinkEthUsdOracleWrapper]
  );
  await balancerDepositWethFei.deployTransaction.wait();

  logging && console.log('Balancer WETH/FEI deposit :', balancerDepositWethFei.address);

  return {
    balancerDepositBalWeth,
    balancerDepositTribeWeth,
    balancerDepositWethFei,
    balancerPoolOwnerImplementation,
    balancerPoolOwnerProxy,
    balancerTribeWethPool,
    balancerWethFeiPool
  } as NamedContracts;
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
  // No more BAL on the timelock
  expect(await contracts.bal.balanceOf(contracts.feiDAOTimelock.address)).to.be.equal('0');

  // Expect BAL to be moved to the new deposit.
  // The amount accounts for the ETH deposited in addition to the BAL
  // Should be between [240k, 260k].
  const balBalance = await contracts.balancerDepositBalWeth.balance();
  expect(balBalance).to.be.at.least('240000000000000000000000');
  expect(balBalance).to.be.at.most('260000000000000000000000');

  // CR Oracle updates for the BAL
  expect(await contracts.collateralizationOracle.depositToToken(contracts.balancerDepositBalWeth.address)).to.be.equal(
    addresses.bal
  );

  // DAO should be able to change the swap fees in a Balancer pool through proxy
  const daoSigner = await getImpersonatedSigner(addresses.feiDAOTimelock);
  await forceEth(addresses.feiDAOTimelock);
  expect(await contracts.balancerWethFeiPool.getSwapFeePercentage()).to.be.equal('3000000000000000'); // 0.3%
  const poolOwner = await ethers.getContractAt('BalancerPoolOwner', contracts.balancerPoolOwnerProxy.address);
  await poolOwner.connect(daoSigner).setSwapFeePercentage(
    contracts.balancerWethFeiPool.address,
    '1000000000000000' // 0.1% swap fees instead of 0.3%
  );
  expect(await contracts.balancerWethFeiPool.getSwapFeePercentage()).to.be.equal('1000000000000000'); // 0.1%
};

export { deploy, setup, teardown, validate };
