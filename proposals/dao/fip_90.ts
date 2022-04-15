import hre, { ethers, artifacts } from 'hardhat';
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
import { AngleTokenPCVDeposit } from '@custom-types/contracts/AngleTokenPCVDeposit';
import { Console } from 'console';

const e18 = (x) => ethers.constants.WeiPerEther.mul(x);

const fipNumber = '90';
const linearPoolUpperTarget = '5000000000000000000000000'; // 5M
const linearPoolSwapFeePercentage = '200000000000000'; // 0.02%
const erc4626VaultFuse8Fei = '0xf486608dbc7dd0eb80e4b9fa0fdb03e40f414030';
const erc4626VaultFuse8Dai = '0xba63738c2e476b1a0cfb6b41a7b85d304d032454';
const erc4626VaultFuse8Lusd = '0x83e556baea9b5fa5f131bc89a4c7282ca240b156';
const stablePoolAmplificationFactor = '500';
const stablePoolTokenRateCacheDuration = '21600'; // 6h
const stablePoolSwapFeePercentage = '100000000000000'; // 0.01%
const balancerBoostedFuseFeiLinearPoolAddress = '0xc8C79fCD0e859e7eC81118e91cE8E4379A481ee6';
const balancerBoostedFuseDaiLinearPoolAddress = '0x8f4063446F5011bC1C9F79A819EFE87776F23704';
const balancerBoostedFuseLusdLinearPoolAddress = '0xb0F75E97A114A4EB4a425eDc48990e6760726709';
const balancerBoostedFuseFeiLinearPoolId = '0xc8c79fcd0e859e7ec81118e91ce8e4379a481ee6000000000000000000000196';
const balancerBoostedFuseDaiLinearPoolId = '0x8f4063446f5011bc1c9f79a819efe87776f23704000000000000000000000197';
const balancerBoostedFuseLusdLinearPoolId = '0xb0f75e97a114a4eb4a425edc48990e6760726709000000000000000000000198';
const balancerBoostedFuseUsdStablePoolAddress = '0xD997f35c9b1281B82C8928039D14CdDaB5e13c20';
const balancerBoostedFuseUsdStablePoolId = '0xd997f35c9b1281b82c8928039d14cddab5e13c2000000000000000000000019c';

// Do any deployments
// This should exclusively include new contract deployments
const deploy: DeployUpgradeFunc = async (deployAddress: string, addresses: NamedAddresses, logging: boolean) => {
  // Stable Pool Manager
  /*const stableBalancerPoolManagerFactory = await ethers.getContractFactory('StableBalancerPoolManager');
  const stableBalancerPoolManager = await stableBalancerPoolManagerFactory.deploy(addresses.core);
  await stableBalancerPoolManager.deployed();
  logging && console.log('stableBalancerPoolManager: ', stableBalancerPoolManager.address);*/

  // Linear Pool Manager
  /*const linearBalancerPoolManagerFactory = await ethers.getContractFactory('LinearBalancerPoolManager');
  const linearBalancerPoolManager = await linearBalancerPoolManagerFactory.deploy(addresses.core);
  await linearBalancerPoolManager.deployed();
  logging && console.log('linearBalancerPoolManager: ', linearBalancerPoolManager.address);*/

  // Linear Pool Factory
  /*const linearPoolFactory = await ethers.getContractAt(
    'IERC4626LinearPoolFactory',
    '0xE061bF85648e9FA7b59394668CfEef980aEc4c66' // ERC4626LinearPoolFactory
  );

  const tx1: any = await linearPoolFactory.create(
    'Balancer Fuse-8 Boosted FEI', // linear pool name
    'bb-f-FEI', // linear pool token symbol
    addresses.fei,
    erc4626VaultFuse8Fei,
    linearPoolUpperTarget,
    linearPoolSwapFeePercentage,
    linearBalancerPoolManager.address // pool owner
  );
  const txReceipt1 = await tx1.wait();
  // events[1] is PoolRegistered (index_topic_1 bytes32 poolId, index_topic_2 address poolAddress, uint8 specialization)
  const balancerBoostedFuseFeiLinearPool = await ethers.getContractAt(
    'ILinearPool',
    txReceipt1.events[1].topics[1].slice(0, 42)
  );
  logging && console.log('FEI  Linear Pool address :', balancerBoostedFuseFeiLinearPool.address);

  const tx2: any = await linearPoolFactory.create(
    'Balancer Fuse-8 Boosted DAI', // linear pool name
    'bb-f-DAI', // linear pool token symbol
    addresses.dai,
    erc4626VaultFuse8Dai,
    linearPoolUpperTarget,
    linearPoolSwapFeePercentage,
    linearBalancerPoolManager.address // pool owner
  );
  const txReceipt2 = await tx2.wait();
  // events[1] is PoolRegistered (index_topic_1 bytes32 poolId, index_topic_2 address poolAddress, uint8 specialization)
  const balancerBoostedFuseDaiLinearPool = await ethers.getContractAt(
    'ILinearPool',
    txReceipt2.events[1].topics[1].slice(0, 42)
  );
  logging && console.log('DAI  Linear Pool address :', balancerBoostedFuseDaiLinearPool.address);

  const tx3: any = await linearPoolFactory.create(
    'Balancer Fuse-8 Boosted LUSD', // linear pool name
    'bb-f-LUSD', // linear pool token symbol
    addresses.lusd,
    erc4626VaultFuse8Lusd,
    linearPoolUpperTarget,
    linearPoolSwapFeePercentage,
    linearBalancerPoolManager.address // pool owner
  );
  const txReceipt3 = await tx3.wait();
  // events[1] is PoolRegistered (index_topic_1 bytes32 poolId, index_topic_2 address poolAddress, uint8 specialization)
  const balancerBoostedFuseLusdLinearPool = await ethers.getContractAt(
    'ILinearPool',
    txReceipt3.events[1].topics[1].slice(0, 42)
  );
  logging && console.log('LUSD Linear Pool address :', balancerBoostedFuseLusdLinearPool.address);*/

  // Stable Phantom Pool Factory
  /*const stablePhantomPoolFactory = await ethers.getContractAt(
    'IStablePhantomPoolFactory',
    addresses.balancerStablePhantomPoolFactory
  );

  const tx4: any = await stablePhantomPoolFactory.create(
    'Balancer Fuse-8 Boosted USD', // linear pool name
    'bb-f-USD', // linear pool token symbol
    [ // tokens = bb-f-DAI, bb-f-LUSD, bb-f-FEI
      addresses.balancerBoostedFuseDaiLinearPool,
      addresses.balancerBoostedFuseLusdLinearPool,
      addresses.balancerBoostedFuseFeiLinearPool
    ],
    stablePoolAmplificationFactor,
    [ // rateProviders
      addresses.balancerBoostedFuseDaiLinearPool,
      addresses.balancerBoostedFuseLusdLinearPool,
      addresses.balancerBoostedFuseFeiLinearPool
    ],
    [
      stablePoolTokenRateCacheDuration,
      stablePoolTokenRateCacheDuration,
      stablePoolTokenRateCacheDuration
    ],
    stablePoolSwapFeePercentage,
    addresses.stableBalancerPoolManager // pool owner
  );
  const txReceipt4 = await tx4.wait();
  // events[1] is PoolRegistered (index_topic_1 bytes32 poolId, index_topic_2 address poolAddress, uint8 specialization)
  const balancerBoostedFuseUsdPool = await ethers.getContractAt(
    'IStablePool',
    txReceipt4.events[1].topics[1].slice(0, 42)
  );
  logging && console.log('bb-f-usd pool address :', balancerBoostedFuseUsdPool.address);*/

  /*const contracts = {
    balancerBoostedFuseFeiLinearPool: await ethers.getContractAt(
      'ILinearPool',
      addresses.balancerBoostedFuseFeiLinearPool
    ),
    balancerBoostedFuseDaiLinearPool: await ethers.getContractAt(
      'ILinearPool',
      addresses.balancerBoostedFuseDaiLinearPool
    ),
    balancerBoostedFuseLusdLinearPool: await ethers.getContractAt(
      'ILinearPool',
      addresses.balancerBoostedFuseLusdLinearPool
    ),
    balancerBoostedFuseUsdStablePool: await ethers.getContractAt(
      'IStablePool',
      addresses.balancerBoostedFuseUsdStablePool
    ),
    balancerVault: await ethers.getContractAt(
      'IVault',
      addresses.balancerVault
    )
  };

  const deployerAddress = '0xcE96fE7Eb7186E9F894DE7703B4DF8ea60E2dD77';
  const bbfFeiBalance = await contracts.balancerBoostedFuseFeiLinearPool.balanceOf(deployerAddress);
  const bbfDaiBalance = await contracts.balancerBoostedFuseDaiLinearPool.balanceOf(deployerAddress);
  const bbfLusdBalance = await contracts.balancerBoostedFuseLusdLinearPool.balanceOf(deployerAddress);
  console.log('bb-f-FEI  Balance', Number(bbfFeiBalance.toString())/1e18);
  console.log('bb-f-DAI  Balance', Number(bbfDaiBalance.toString())/1e18);
  console.log('bb-f-LUSD Balance', Number(bbfLusdBalance.toString())/1e18);

  console.log('Approve bb-f-FEI on vault...');
  await contracts.balancerBoostedFuseFeiLinearPool.approve(
    addresses.balancerVault,
    bbfFeiBalance
  );
  console.log('Approve bb-f-DAI on vault...');
  await contracts.balancerBoostedFuseDaiLinearPool.approve(
    addresses.balancerVault,
    bbfDaiBalance
  );
  console.log('Approve bb-f-LUSD on vault...');
  await contracts.balancerBoostedFuseLusdLinearPool.approve(
    addresses.balancerVault,
    bbfLusdBalance
  );
  console.log('Approval done.');

  console.log('Joining pool...');
  await contracts.balancerVault.joinPool(
      balancerBoostedFuseUsdStablePoolId,
      deployerAddress,
      deployerAddress,
      { // JoinPoolRequest
        assets: [ // IAsset[]
          addresses.balancerBoostedFuseDaiLinearPool, // bb-f-DAI
          addresses.balancerBoostedFuseLusdLinearPool, // bb-f-LUSD
          addresses.balancerBoostedFuseFeiLinearPool, // bb-f-FEI
          addresses.balancerBoostedFuseUsdStablePool // bb-f-USD
        ],
        maxAmountsIn: [ // maxAmountsIn
          bbfDaiBalance,
          bbfLusdBalance,
          bbfFeiBalance,
          '5192296858534827628530496329220095' // uint112.max
        ],
        userData: ethers.utils.defaultAbiCoder.encode(['uint8', 'uint256[]'], [
          '0', // JoinKind.INIT
          [ // amounts = maxAmountsIn
            bbfDaiBalance,
            bbfLusdBalance,
            bbfFeiBalance,
            '5192296858534827628530496329220095' // uint112.max
          ]
        ]), // userData
        fromInternalBalance: false // fromInternalBalance
      }
  );

  const bbfUsdBalance = await contracts.balancerBoostedFuseUsdStablePool.balanceOf(deployerAddress);
  console.log('bb-f-USD Balance', Number((bbfUsdBalance).toString())/1e18);*/

  return {
    //balancerBoostedFuseUsdPool
  };
};

// Do any setup necessary for running the test.
// This could include setting up Hardhat to impersonate accounts,
// ensuring contracts have a specific state, etc.
const setup: SetupUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  logging && console.log(`No setup for FIP-${fipNumber}`);
};

// Tears down any changes made in setup() that need to be
// cleaned up before doing any validation checks.
const teardown: TeardownUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log(`No actions to complete in teardown for fip${fipNumber}`);
};

// Run any validations required on the fip using mocha or console logging
// IE check balances, check state of contracts, etc.
const validate: ValidateUpgradeFunc = async (addresses, oldContracts, contracts, logging) => {
  console.log('hey');
  console.log('Timelock FEI  balance (Me18)', (await contracts.fei.balanceOf(addresses.feiDAOTimelock)) / 1e24);
  console.log('Timelock DAI  balance (Me18)', (await contracts.dai.balanceOf(addresses.feiDAOTimelock)) / 1e24);
  console.log('Timelock LUSD balance (Me18)', (await contracts.lusd.balanceOf(addresses.feiDAOTimelock)) / 1e24);
  console.log(
    'Timelock 4646-fFEI-8  balance (Me18)',
    (await contracts.erc4626VaultFuse8Fei.balanceOf(addresses.feiDAOTimelock)) / 1e24
  );
  console.log(
    'Timelock 4626-fDAI-8  balance (Me18)',
    (await contracts.erc4626VaultFuse8Dai.balanceOf(addresses.feiDAOTimelock)) / 1e24
  );
  console.log(
    'Timelock 4626-fLUSD-8 balance (Me18)',
    (await contracts.erc4626VaultFuse8Lusd.balanceOf(addresses.feiDAOTimelock)) / 1e24
  );
  console.log(
    'Timelock bb-f-FEI  balance',
    (await contracts.balancerBoostedFuseFeiLinearPool.balanceOf(addresses.feiDAOTimelock)).toString()
  );
  console.log(
    'Timelock bb-f-FEI  balance (Me18)',
    (await contracts.balancerBoostedFuseFeiLinearPool.balanceOf(addresses.feiDAOTimelock)) / 1e24
  );
  console.log(
    'Timelock bb-f-DAI  balance (Me18)',
    (await contracts.balancerBoostedFuseDaiLinearPool.balanceOf(addresses.feiDAOTimelock)) / 1e24
  );
  console.log(
    'Timelock bb-f-LUSD balance (Me18)',
    (await contracts.balancerBoostedFuseLusdLinearPool.balanceOf(addresses.feiDAOTimelock)) / 1e24
  );
  console.log(
    'Timelock bb-f-USD  balance',
    (await contracts.balancerBoostedFuseUsdStablePool.balanceOf(addresses.feiDAOTimelock)).toString()
  );
  console.log(
    'Timelock bb-f-USD balance (Me18)',
    (await contracts.balancerBoostedFuseUsdStablePool.balanceOf(addresses.feiDAOTimelock)) / 1e24
  );
};

export { deploy, setup, teardown, validate };
