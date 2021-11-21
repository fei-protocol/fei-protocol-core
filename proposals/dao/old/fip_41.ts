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

// Constants
const MIN_LBP_SIZE = ethers.constants.WeiPerEther.mul(50_000); // 50k FEI

/*

// LBP swapper

DEPLOY ACTIONS:

1. Deploy LUSD Fuse deposit
2. Deploy LUSD LBP Swapper
3. Create LUSD LBP pool
4. Init LUSD LBP Swapper

DAO ACTIONS:
1. Mint 1.1M FEI to Timelock
2. Approve 1.1M FEI to trade on Saddle's D4 pool
3. Swap 1.1M FEI for LUSD on Saddle's D4 pool
4. Transfer LUSD to the LBP Swapper
5. Mint 100M FEI for LBP Swapper
6. Start auction
*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const { core, fei, lusd, oneConstantOracle, balancerLBPoolFactory } = addresses;

  if (!core) {
    console.log(`core: ${core}`);

    throw new Error('An environment variable contract address is not set');
  }

  // Create Compound deposit for LUSD in Fuse pool xyz
  const erc20CompoundPCVDepositFactory = await ethers.getContractFactory('ERC20CompoundPCVDeposit');
  const liquityFusePoolLusdPCVDeposit = await erc20CompoundPCVDepositFactory.deploy(
    core,
    addresses.liquityFusePoolLusd,
    addresses.lusd
  );
  await liquityFusePoolLusdPCVDeposit.deployTransaction.wait();

  logging && console.log('Fuse LUSD Deposit deployed to:', liquityFusePoolLusdPCVDeposit.address);

  // Create LUSD LBP Swapper
  const feiLusdLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const feiLusdLBPSwapper = await feiLusdLBPSwapperFactory.deploy(
    core,
    {
      _oracle: oneConstantOracle,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: true,
      _decimalsNormalizer: 0
    },
    1209600, // auction for 2 weeks
    fei, // tokenSpent
    lusd, // tokenReceived
    liquityFusePoolLusdPCVDeposit.address, // send LUSD to Fuse
    MIN_LBP_SIZE
  );

  await feiLusdLBPSwapper.deployTransaction.wait();

  logging && console.log('FEI->LUSD LBP Swapper deployed to:', feiLusdLBPSwapper.address);

  // Create LUSD LBP pool
  const lbpFactory = await ethers.getContractAt('ILiquidityBootstrappingPoolFactory', balancerLBPoolFactory);

  const tx: TransactionResponse = await lbpFactory.create(
    'FEI->LUSD Auction Pool',
    'apFEI-LUSD',
    [lusd, fei],
    [ethers.constants.WeiPerEther.div(100), ethers.constants.WeiPerEther.mul(99).div(100)],
    ethers.constants.WeiPerEther.mul(30).div(10_000),
    feiLusdLBPSwapper.address,
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const feiLusdLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to:', feiLusdLBPAddress);

  const feiLusdLBP = await ethers.getContractAt('IWeightedPool', feiLusdLBPAddress);

  // Init LUSD LBP Swapper
  const tx2 = await feiLusdLBPSwapper.init(feiLusdLBPAddress);
  await tx2.wait();

  return {
    liquityFusePoolLusdPCVDeposit,
    feiLusdLBPSwapper,
    feiLusdLBP
  } as NamedContracts;
};

export const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No setup for FIP-41');
};

export const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log('No teardown for FIP-41');
};

export const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts) => {
  const { feiLusdLBPSwapper, feiLusdLBP } = contracts;

  // auction should be started, and swap enabled
  expect(await feiLusdLBPSwapper.isTimeStarted()).to.be.true;
  expect(await feiLusdLBP.getSwapEnabled()).to.equal(true);

  // check oracle, should be constant(1)
  const price = (await feiLusdLBPSwapper.readOracle())[0];
  expect(price).to.be.equal(ethers.constants.WeiPerEther.mul(1));

  // check relative price in pool
  const response = await feiLusdLBPSwapper.getTokensIn(100000);
  const amounts = response[1];
  // LUSD/FEI price * LUSD amount * 1% ~= amount
  expect(amounts[1]).to.be.bignumber.equal(ethers.BigNumber.from(100000));
  expectApprox(price.mul(100000).div(ethers.constants.WeiPerEther).div(100), amounts[0]);

  // check pool weights
  const weights = await feiLusdLBP.getNormalizedWeights();
  // LUSD weight ~1%
  expectApprox(weights[0], ethers.constants.WeiPerEther.mul(1).div(100));
  // FEI weight ~99%
  expectApprox(weights[0], ethers.constants.WeiPerEther.mul(99).div(100));

  // get pool info
  const poolId = await feiLusdLBP.getPoolId();
  const poolTokens = await contracts.balancerVault.getPoolTokens(poolId);
  // there should be 1.01M LUSD in the pool
  expect(poolTokens.tokens[0]).to.be.equal(contracts.lusd.address);
  expect(poolTokens.balances[0]).to.be.equal('1010101010101010101010101');
  // there should be 100M FEI in the pool
  expect(poolTokens.tokens[1]).to.be.equal(contracts.fei.address);
  expect(poolTokens.balances[1]).to.be.equal('100000000000000000000000000');
};
