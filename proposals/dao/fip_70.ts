import hre, { ethers } from 'hardhat';
import chai, { expect } from 'chai';
import CBN from 'chai-bn';
import { DeployUpgradeFunc, SetupUpgradeFunc, TeardownUpgradeFunc, ValidateUpgradeFunc } from '@custom-types/types';
import { TransactionResponse } from '@ethersproject/providers';
import { expectApproxAbs, time } from '@test/helpers';

chai.use(CBN(ethers.BigNumber));

let uniswapEthBalanceBefore: any;
let balancerFeiWethPool: any;

/*
FIP-70
DEPLOY ACTIONS:
- Create a WeightedBalancerPoolManagerBase to be admin of the DAO's WeightedPools
- Create a FEI 30% / WETH 70% WeightedPool
- Create a PCVDeposit for the new B-30FEI-70WETH Balancer pool owned by the DAO
- Create a DelayedPCVMover to move the 2nd half of WETH/FEI liquidity
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  // Create a WeightedBalancerPoolManager contract
  const weightedBalancerPoolManagerBaseFactory = await ethers.getContractFactory('WeightedBalancerPoolManagerBase');
  const weightedBalancerPoolManagerBase = await weightedBalancerPoolManagerBaseFactory.deploy(addresses.core);
  await weightedBalancerPoolManagerBase.deployTransaction.wait();
  logging && console.log('weightedBalancerPoolManagerBase: ', weightedBalancerPoolManagerBase.address);

  // Create a new FEI/WETH pool
  const weightedPoolTwoTokensFactory = await ethers.getContractAt(
    'IWeightedPool2TokensFactory',
    addresses.balancerWeightedPoolFactory
  );
  const tx: TransactionResponse = await weightedPoolTwoTokensFactory.create(
    'Balancer 30 FEI 70 WETH',
    'B-30FEI-70WETH',
    [addresses.fei, addresses.weth],
    [ethers.constants.WeiPerEther.mul(30).div(100), ethers.constants.WeiPerEther.mul(70).div(100)], // 30% FEI 70% WETH
    ethers.constants.WeiPerEther.mul(30).div(10_000), // 0.3% swap fees
    true, // oracleEnabled
    weightedBalancerPoolManagerBase.address // pool owner
  );
  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  balancerFeiWethPool = await ethers.getContractAt('IWeightedPool', rawLogs[0].address);
  logging && console.log('balancerFeiWethPool address: ', balancerFeiWethPool.address);
  logging && console.log('balancerFeiWethPool id: ', await balancerFeiWethPool.getPoolId());

  // Create a new Balancer deposit for the FEI/WETH pool
  const balancerDepositWeightedPoolFactory = await ethers.getContractFactory('BalancerPCVDepositWeightedPool');
  const balancerDepositFeiWeth = await balancerDepositWeightedPoolFactory.deploy(
    addresses.core,
    addresses.balancerVault,
    addresses.balancerRewards,
    await balancerFeiWethPool.getPoolId(), // poolId
    '10', // max 0.1% slippage
    addresses.weth, // accounting in WETH
    [addresses.oneConstantOracle, addresses.chainlinkEthUsdOracleWrapper]
  );
  await balancerDepositFeiWeth.deployTransaction.wait();
  logging && console.log('balancerDepositFeiWeth: ', balancerDepositFeiWeth.address);

  // Create a delayed PCV mover for the 2nd half of FEI-ETH liquidity
  const delayedPCVMoverFactory = await ethers.getContractFactory('DelayedPCVMover');
  const delayedPCVMoverWethUniToBal = await delayedPCVMoverFactory.deploy(
    addresses.core,
    '1643930000', // Thu Feb 03 2022 15:13:20 GMT-0800 (PT)
    addresses.ratioPCVControllerV2, // controller used to move funds
    addresses.uniswapPCVDeposit, // deposit from = uniswapPCVDeposit
    balancerDepositFeiWeth.address, // deposit target = balancerDepositFeiWeth
    '10000' // 100% of remaining funds
  );
  await delayedPCVMoverWethUniToBal.deployTransaction.wait();
  logging && console.log('delayedPCVMoverWethUniToBal: ', delayedPCVMoverWethUniToBal.address);

  return {
    weightedBalancerPoolManagerBase,
    balancerFeiWethPool,
    balancerDepositFeiWeth,
    delayedPCVMoverWethUniToBal
  };
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  // initial checks : should start with ~40k ETH on Uniswap & 0 on Balancer
  uniswapEthBalanceBefore = await contracts.uniswapPCVDeposit.balance();
  expect(uniswapEthBalanceBefore).to.be.at.least(ethers.constants.WeiPerEther.mul('5000'));
  expect(await contracts.balancerDepositFeiWeth.balance()).to.be.equal('0');

  logging && console.log('No setup');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  // Should have removed half ETH from Uniswap
  const uniswapEthBalanceAfter = await contracts.uniswapPCVDeposit.balance();
  const uniswapEthBalanceRemoved = uniswapEthBalanceBefore.sub(uniswapEthBalanceAfter);
  expectApproxAbs(
    uniswapEthBalanceRemoved,
    uniswapEthBalanceBefore.div(2),
    ethers.constants.WeiPerEther.toString() // +/- 1 ETH
  );

  // Should have moved half ETH to Balancer
  expectApproxAbs(
    await contracts.balancerDepositFeiWeth.balance(),
    uniswapEthBalanceBefore.div(2),
    ethers.constants.WeiPerEther.toString() // +/- 1 ETH
  );

  // Check for right amounts of ETH and FEI in resistantBalanceAndFei
  expectApproxAbs(
    (await contracts.balancerDepositFeiWeth.resistantBalanceAndFei())[0],
    uniswapEthBalanceBefore.div(2),
    ethers.constants.WeiPerEther.toString() // +/- 1 ETH
  );
  const ethPrice = (await contracts.chainlinkEthUsdOracleWrapper.read())[0] / 1e18; // ~3200.0 in Number
  expectApproxAbs(
    (await contracts.balancerDepositFeiWeth.resistantBalanceAndFei())[1],
    ethers.constants.WeiPerEther.mul(
      Math.round((((ethPrice * uniswapEthBalanceBefore * 0.5) / 1e18) * 30) / 70).toString()
    ),
    ethers.constants.WeiPerEther.mul('10000').toString() // +/- 10k FEI
  );

  // Check Balancer pool and its content
  const poolId = await contracts.balancerFeiWethPool.getPoolId();
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  // check pool tokens
  expect(poolTokens.tokens[0]).to.be.equal(contracts.fei.address);
  expect(poolTokens.tokens[1]).to.be.equal(contracts.weth.address);
  const weights = await contracts.balancerFeiWethPool.getNormalizedWeights();
  // check pool weights
  expect(weights[0]).to.be.equal('300000000000000000'); // 30% FEI
  expect(weights[1]).to.be.equal('700000000000000000'); // 70% WETH
  // balances in the pool should roughly match what's reported by the PCVDeposit
  expectApproxAbs(
    (await contracts.balancerDepositFeiWeth.resistantBalanceAndFei())[0],
    poolTokens.balances[1],
    ethers.constants.WeiPerEther.toString() // +/- 1 ETH
  );
  expectApproxAbs(
    (await contracts.balancerDepositFeiWeth.resistantBalanceAndFei())[1],
    poolTokens.balances[0],
    ethers.constants.WeiPerEther.mul('10000').toString() // +/- 10k FEI
  );

  // New Balancer deposit is added to CR oracle
  expect(await contracts.collateralizationOracle.depositToToken(addresses.balancerDepositFeiWeth)).to.be.equal(
    addresses.weth
  );

  return;

  // Forward time 10 days, when the other half of liquidity will be available for movement
  const deadline = await contracts.delayedPCVMoverWethUniToBal.deadline();
  const currentTime = await time.latest();
  if (deadline > currentTime) await time.increaseTo(deadline);

  // Move the 2nd half of PCV
  expect(
    await contracts.core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), contracts.delayedPCVMoverWethUniToBal.address)
  ).to.be.true;
  await contracts.delayedPCVMoverWethUniToBal.withdrawRatio();
  await contracts.balancerDepositFeiWeth.deposit();

  // Check that 2nd half of PCV has moved properly
  expect(await contracts.uniswapPCVDeposit.balance()).to.be.at.most(ethers.constants.WeiPerEther);
  expectApproxAbs(
    await contracts.balancerDepositFeiWeth.balance(),
    uniswapEthBalanceBefore,
    ethers.constants.WeiPerEther.toString() // +/- 1 ETH
  );

  // Check content of the Balancer pool
  const poolTokensAfter2ndMovement = await contracts.balancerVault.getPoolTokens(poolId);
  expectApproxAbs(
    poolTokensAfter2ndMovement.balances[0],
    ethers.constants.WeiPerEther.mul(Math.round((((ethPrice * uniswapEthBalanceBefore) / 1e18) * 30) / 70).toString()),
    ethers.constants.WeiPerEther.mul('10000').toString() // +/- 10k FEI
  );
  expectApproxAbs(
    poolTokensAfter2ndMovement.balances[1],
    uniswapEthBalanceBefore,
    ethers.constants.WeiPerEther.toString() // +/- 1 ETH
  );

  // The DelayedPCVMover should have revoked its PCV_CONTROLLER_ROLE role
  expect(
    await contracts.core.hasRole(ethers.utils.id('PCV_CONTROLLER_ROLE'), contracts.delayedPCVMoverWethUniToBal.address)
  ).to.be.false;
};
