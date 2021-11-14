import hre, { ethers, artifacts, network } from 'hardhat';
import chai from 'chai';
import CBN from 'chai-bn';
import {
  Core,
  Core__factory,
  UniswapV3Pool,
  UniswapV3Factory,
  NonfungiblePositionManager,
  SwapRouter,
  MockSAFEEngine,
  MockGebSafeManager,
  CoinJoin,
  Coin,
  BasicCollateralJoin,
  MockLiquidationEngine
} from '@custom-types/contracts';
import { BigNumber, BigNumberish, Signer } from 'ethers';
import { NamedAddresses } from '@custom-types/types';
import SwapRouterArtifacts from '@uniswap/v3-periphery/artifacts/contracts/SwapRouter.sol/SwapRouter.json';
import PositioinManagerArtifacts from '@uniswap/v3-periphery/artifacts/contracts/NonfungiblePositionManager.sol/NonfungiblePositionManager.json';
import NFTDescriptorArtifacts from '@uniswap/v3-periphery/artifacts/contracts/libraries/NFTDescriptor.sol/NFTDescriptor.json';
import NonfungibleTokenPositionDescriptor from '@uniswap/v3-periphery/artifacts/contracts/NonfungibleTokenPositionDescriptor.sol/NonfungibleTokenPositionDescriptor.json';
import UniswapV3FactoryArtifacts from '@uniswap/v3-core/artifacts/contracts/UniswapV3Factory.sol/UniswapV3Factory.json';
import UniswapV3PoolArtifacts from '@uniswap/v3-core/artifacts/contracts/UniswapV3Pool.sol/UniswapV3Pool.json';
import { encodePriceSqrt } from './unit/utils/uniswapV3';

// use default BigNumber
chai.use(CBN(ethers.BigNumber));

const toBN = ethers.BigNumber.from;
const { expect } = chai;
const WETH9 = artifacts.readArtifactSync('WETH9');

async function deployDevelopmentWeth(): Promise<void> {
  await network.provider.send('hardhat_setCode', [
    '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
    WETH9.deployedBytecode
  ]);

  const weth = await ethers.getContractAt(WETH9.abi, '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2');
  await weth.init();
}

async function getAddresses(): Promise<NamedAddresses> {
  const [
    userAddress,
    secondUserAddress,
    beneficiaryAddress1,
    beneficiaryAddress2,
    governorAddress,
    genesisGroup,
    keeperAddress,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    guardianAddress
  ] = (await ethers.getSigners()).map((signer) => signer.address);

  return {
    userAddress,
    secondUserAddress,
    beneficiaryAddress1,
    beneficiaryAddress2,
    governorAddress,
    genesisGroup,
    keeperAddress,
    pcvControllerAddress,
    minterAddress,
    burnerAddress,
    guardianAddress
  };
}

async function getImpersonatedSigner(address: string): Promise<Signer> {
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [address]
  });

  const signer = await ethers.getSigner(address);

  return signer;
}

async function increaseTime(amount: number | string | BigNumberish): Promise<void> {
  await time.increase(amount);
}

async function resetTime(): Promise<void> {
  await resetFork();
}

async function resetFork(): Promise<void> {
  await hre.network.provider.request({
    method: 'hardhat_reset',
    params: [
      {
        forking: hre.config.networks.hardhat.forking
          ? {
              jsonRpcUrl: hre.config.networks.hardhat.forking.url
            }
          : undefined
      }
    ]
  });
}

async function setNextBlockTimestamp(time: number): Promise<void> {
  await hre.network.provider.request({
    method: 'evm_setNextBlockTimestamp',
    params: [time]
  });
}

async function latestTime(): Promise<number> {
  const { timestamp } = await ethers.provider.getBlock(await ethers.provider.getBlockNumber());

  return timestamp as number;
}

async function mine(): Promise<void> {
  await hre.network.provider.request({
    method: 'evm_mine'
  });
}

async function getCore(): Promise<Core> {
  const { governorAddress, pcvControllerAddress, minterAddress, burnerAddress, guardianAddress } = await getAddresses();

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [governorAddress]
  });

  const governorSigner = await ethers.getSigner(governorAddress);

  const coreFactory = new Core__factory(governorSigner);
  const core = await coreFactory.deploy();

  await core.init();
  await core.grantMinter(minterAddress);
  await core.grantBurner(burnerAddress);
  await core.grantPCVController(pcvControllerAddress);
  await core.grantGuardian(guardianAddress);

  return core;
}

async function getUniswapV3Mock(
  tokenA: string,
  tokenB: string,
  weth: string,
  fee: number,
  reserve0: BigNumber,
  reserve1: BigNumber
): Promise<{
  positionManager: NonfungiblePositionManager;
  factory: UniswapV3Factory;
  pool: UniswapV3Pool;
  router: SwapRouter;
}> {
  const { userAddress, governorAddress, pcvControllerAddress, minterAddress, burnerAddress, guardianAddress } =
    await getAddresses();

  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [userAddress]
  });

  const userSigner = await ethers.getSigner(userAddress);

  const factory = (await new ethers.ContractFactory(
    UniswapV3FactoryArtifacts.abi,
    UniswapV3FactoryArtifacts.bytecode,
    userSigner
  ).deploy()) as UniswapV3Factory;

  const nftDescriptorLibrary = await new ethers.ContractFactory(
    NFTDescriptorArtifacts.abi,
    NFTDescriptorArtifacts.bytecode,
    userSigner
  ).deploy();

  const linkReferences =
    NonfungibleTokenPositionDescriptor.linkReferences['contracts/libraries/NFTDescriptor.sol']['NFTDescriptor'];
  const bytecode = NonfungibleTokenPositionDescriptor.bytecode;
  const libAddress = nftDescriptorLibrary.address;
  const { start, length } = linkReferences[0];
  const linkedBytecode =
    bytecode.substr(0, 2 + start * 2) + libAddress.substr(2) + bytecode.substr(2 + (start + length) * 2);

  const positionDescriptorFactory = new ethers.ContractFactory(
    NonfungibleTokenPositionDescriptor.abi,
    linkedBytecode,
    userSigner
  );
  const nftDescriptor = await positionDescriptorFactory.deploy(
    weth,
    '0x4554480000000000000000000000000000000000000000000000000000000000' // 'ETH' as a bytes32 string
  );
  const nft = (await new ethers.ContractFactory(
    PositioinManagerArtifacts.abi,
    PositioinManagerArtifacts.bytecode,
    userSigner
  ).deploy(factory.address, weth, nftDescriptor.address)) as NonfungiblePositionManager;

  const tokens = tokenA.toLowerCase() < tokenB.toLowerCase() ? [tokenA, tokenB] : [tokenB, tokenA];
  await nft.createAndInitializePoolIfNecessary(tokens[0], tokens[1], fee, encodePriceSqrt(reserve1, reserve0));

  const poolAddress = await factory.getPool(tokenB, tokenA, fee);
  const pool = new ethers.Contract(poolAddress, UniswapV3PoolArtifacts.abi, userSigner) as UniswapV3Pool;

  const router = (await new ethers.ContractFactory(
    SwapRouterArtifacts.abi,
    SwapRouterArtifacts.bytecode,
    userSigner
  ).deploy(factory.address, weth)) as SwapRouter;

  console.log(`nft:${nft.address}\n factory:${factory.address}\n pool:${pool.address}\n router:${router.address} `);
  return { positionManager: nft, factory, pool, router };
}

async function getRaiMock(weth: string): Promise<{
  safeEngine: MockSAFEEngine;
  coin: Coin;
  coinJoin: CoinJoin;
  collateralJoin: BasicCollateralJoin;
  safeManager: MockGebSafeManager;
  liquidationEngine: MockLiquidationEngine;
}> {
  const { userAddress, governorAddress, pcvControllerAddress, minterAddress, burnerAddress, guardianAddress } =
    await getAddresses();
  const toRay = (n) => ethers.utils.parseEther(n).mul(BigNumber.from('10').pow(9));
  await hre.network.provider.request({
    method: 'hardhat_impersonateAccount',
    params: [governorAddress]
  });

  const governorSigner = await ethers.getSigner(governorAddress);
  const collateralType = ethers.utils.formatBytes32String('ETH-A'); //'0x4554482d41000000000000000000000000000000000000000000000000000000';

  const safeEngine = (await (
    await ethers.getContractFactory('MockSAFEEngine', governorSigner)
  ).deploy()) as MockSAFEEngine;
  // Initialize ETH-A collateral type
  await safeEngine.initializeCollateralType(collateralType);
  // Set global and collateral parameters
  await safeEngine['modifyParameters(bytes32,bytes32,uint256)'](
    collateralType,
    ethers.utils.formatBytes32String('safetyPrice'),
    toRay('100') // ETH/RAI 400:4
  );
  await safeEngine['modifyParameters(bytes32,bytes32,uint256)'](
    collateralType,
    ethers.utils.formatBytes32String('liquidationPrice'),
    toRay('100')
  );
  await safeEngine['modifyParameters(bytes32,bytes32,uint256)'](
    collateralType,
    ethers.utils.formatBytes32String('debtCeiling'),
    toBN(10000).mul(BigNumber.from(10).pow(45)) // [rad]
  );
  await safeEngine['modifyParameters(bytes32,uint256)'](
    ethers.utils.formatBytes32String('globalDebtCeiling'),
    toBN(100000).mul(BigNumber.from(10).pow(45)) // [rad]
  );
  await safeEngine['modifyParameters(bytes32,uint256)'](
    ethers.utils.formatBytes32String('safeDebtCeiling'),
    toBN(100000).mul(BigNumber.from(10).pow(18)) // [wad]
  );
  // Rai
  const coin = (await (
    await ethers.getContractFactory('Coin', governorSigner)
  ).deploy('Mock Reflexer Index', 'RAI', 1)) as Coin;
  // Gateway
  const coinJoin = (await (
    await ethers.getContractFactory('CoinJoin', governorSigner)
  ).deploy(safeEngine.address, coin.address)) as CoinJoin;
  const collateralJoin = (await (
    await ethers.getContractFactory('BasicCollateralJoin', governorSigner)
  ).deploy(safeEngine.address, collateralType, weth)) as BasicCollateralJoin;
  // add auth to coinJoin
  await coin.addAuthorization(coinJoin.address);
  // add auth to gateways
  await safeEngine.addAuthorization(collateralJoin.address);
  await safeEngine.addAuthorization(coinJoin.address);
  // Safe Helper
  const safeManager = (await (
    await ethers.getContractFactory('MockGebSafeManager', governorSigner)
  ).deploy(safeEngine.address)) as MockGebSafeManager;
  // Liquidation Engine
  const liquidationEngine = (await (
    await ethers.getContractFactory('MockLiquidationEngine', governorSigner)
  ).deploy(safeEngine.address)) as MockLiquidationEngine;
  console.log(
    `safeEngine:${safeEngine.address}\n coinJoin:${coinJoin.address}\n coin:${coin.address}\n collateralJoin:${collateralJoin.address}\n safeManager:${safeManager.address} liquidationEngine:${liquidationEngine.address} `
  );
  return { safeEngine, coin, coinJoin, collateralJoin, safeManager, liquidationEngine };
}

async function expectApprox(
  actual: string | number | BigNumberish,
  expected: string | number | BigNumberish,
  magnitude = '1000'
): Promise<void> {
  const actualBN = toBN(actual);
  const expectedBN = toBN(expected);
  const magnitudeBN = toBN(magnitude);

  const diff = actualBN.sub(expectedBN);
  const diffAbs = diff.abs();

  if (expected.toString() == '0' || expected == 0 || expected == '0') {
    expect(diffAbs).to.be.lt(magnitudeBN);
  } else {
    expect(diffAbs.div(expected).lt(magnitudeBN)).to.be.true;
  }
}

async function expectRevert(tx, errorMessage: string): Promise<void> {
  await expect(tx).to.be.revertedWith(errorMessage);
}

async function expectUnspecifiedRevert(tx): Promise<void> {
  await expect(tx).to.be.reverted;
}

const ZERO_ADDRESS = ethers.constants.AddressZero;
const MAX_UINT256 = ethers.constants.MaxUint256;

const balance = {
  current: async (address: string): Promise<BigNumber> => {
    const balance = await ethers.provider.getBalance(address);
    return balance;
  }
};

const time = {
  latest: async (): Promise<number> => latestTime(),

  latestBlock: async (): Promise<number> => await ethers.provider.getBlockNumber(),

  increase: async (duration: number | string | BigNumberish): Promise<void> => {
    const durationBN = ethers.BigNumber.from(duration);

    if (durationBN.lt(ethers.constants.Zero)) throw Error(`Cannot increase time by a negative amount (${duration})`);

    await hre.network.provider.send('evm_increaseTime', [durationBN.toNumber()]);

    await hre.network.provider.send('evm_mine');
  },

  increaseTo: async (target: number | string | BigNumberish): Promise<void> => {
    const targetBN = ethers.BigNumber.from(target);

    const now = ethers.BigNumber.from(await time.latest());

    if (targetBN.lt(now)) throw Error(`Cannot increase current time (${now}) to a moment in the past (${target})`);
    const diff = targetBN.sub(now);
    return time.increase(diff);
  },

  advanceBlockTo: async (target: number | string | BigNumberish): Promise<void> => {
    target = ethers.BigNumber.from(target);

    const currentBlock = await time.latestBlock();
    const start = Date.now();
    let notified;
    if (target.lt(currentBlock))
      throw Error(`Target block #(${target}) is lower than current block #(${currentBlock})`);
    while (ethers.BigNumber.from(await time.latestBlock()).lt(target)) {
      if (!notified && Date.now() - start >= 5000) {
        notified = true;
        console.warn(`You're advancing many blocks; this test may be slow.`);
      }
      await time.advanceBlock();
    }
  },

  advanceBlock: async (): Promise<void> => {
    await hre.network.provider.send('evm_mine');
  }
};

export {
  // utils
  ZERO_ADDRESS,
  MAX_UINT256,
  time,
  balance,
  expectRevert,
  expectUnspecifiedRevert,
  // functions
  mine,
  getCore,
  getUniswapV3Mock,
  getRaiMock,
  getAddresses,
  increaseTime,
  latestTime,
  expectApprox,
  deployDevelopmentWeth,
  getImpersonatedSigner,
  setNextBlockTimestamp,
  resetTime,
  resetFork
};
