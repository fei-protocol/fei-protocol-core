import { TransactionResponse } from '@ethersproject/abstract-provider';
import { ethers } from 'hardhat';
import { getAllContractAddresses } from '@test/integration/setup/loadContracts';
import { DeployUpgradeFunc, NamedContracts } from '@custom-types/types';

const toBN = ethers.BigNumber.from;

// Constants
const e16: string = '0000000000000000';
const e14: string = '00000000000000';

// CR oracle wrapper
const CR_WRAPPER_DURATION: string = '60'; // 1 minute
const CR_WRAPPER_DEVIATION_BPS: string = '500'; // 5%
const CR_KEEPER_INCENTIVE: string = toBN(1000).mul(ethers.constants.WeiPerEther).toString(); // 1000 FEI

// Tribe reserve stabilizer
const USD_PER_FEI_BPS: string = '10000'; // $1 FEI
const CR_THRESHOLD_BPS: string = '10000'; // 100% CR
const MAX_RESERVE_STABILIZER_MINT_RATE: string = toBN(1000).mul(ethers.constants.WeiPerEther).toString(); // 1000 TRIBE/s
const RESERVE_STABILIZER_MINT_RATE: string = toBN(100).mul(ethers.constants.WeiPerEther).toString(); // 100 TRIBE/s
const TRIBE_BUFFER_CAP: string = toBN(5000000).mul(ethers.constants.WeiPerEther).toString(); // 5M TRIBE

// LBP swapper
const LBP_FREQUENCY: string = '604800'; // weekly
const MIN_LBP_SIZE: string = toBN(100000).mul(ethers.constants.WeiPerEther).toString(); // 100k FEI

// PCV Equity Minter
const PCV_EQUITY_MINTER_INCENTIVE: string = toBN(1000).mul(ethers.constants.WeiPerEther).toString(); // 1000 FEI
const PCV_EQUITY_MINTER_FREQUENCY: string = '604800'; // weekly
const PCV_EQUITY_MINTER_APR_BPS: string = '1000'; // 10%

// ERC20Splitter
const SPLIT_DAO_BPS: string = '2000'; // 20%
const SPLIT_LM_BPS: string = '2000'; // 20%
const SPLIT_BURN_BPS: string = '6000'; // 60%

// ETH Bonding Curve
const SCALE: string = toBN(1).mul(ethers.constants.WeiPerEther).toString(); // 1 FEI
const BUFFER: string = '50'; // 0.5%
const DISCOUNT: string = '0'; // 0%
const BC_DURATION: string = '86400'; // 1w
const BC_INCENTIVE: string = toBN(500).mul(ethers.constants.WeiPerEther).toString();

const USD_ADDRESS = '0x1111111111111111111111111111111111111111';

/*

V2 Phase 1 Upgrade

Part 3 - Deploys collateralization oracle keeper, collateralization oracle guardian, chainlink oracle wrapper for tribe-eth, chainlink composite oracle for tribe-usd, tribe reserve stabilizer, 
         tribe splitter, pcv equity minter, and the balancer-v2 liquidity bootstrapping pool (and associated swapper). Grants
         burner role[remove] to the tribe reserve stabilizer, and minter roles to the pvc equity minter & collateralization oracle keeper.
         Also grants tribe-minter role to the tribe reserve stabilizer, and seeds tribe to the liquidity bootstrapping pool swapper.

        // todo: move pcv-transfer to p1
        // todo: pr to change ALL reserve stabilizers to transfer to dumpster contract (make this too) which actually burns it
        // todo: move keeper deployment to p3
        // todo: deploy collateralization-oracle guardian in p3
        // todo: add oracle-admin-role-grant to collateralizationoracle guardian


----- PART 3 -----

DEPLOY ACTIONS:
1. Collateralization Ratio Oracle Keeer
2. Collateralization Oracle Guardian
3. Chainlink Tribe ETH Oracle Wrapper
4. Chainlink Tribe USD Composite Oracle
5. Tribe Reserve Stabilizer
6. Tribe Splitter
7. Fei Tribe LBP Swapper
8. Fei Tribe LBP (Liquidity Bootstrapping Pool)
9. PCV Equity Minter

DAO ACTIONS:
1. Grant Burner role to new TribeReserveStabilizer
2. Grant Minter role to PCV Equity Minter
3. Grant Minter role to Collateralization Oracle Keeper
4. Grant Tribe Minter role to Tribe Reserve Stabilizer
5. Grant Oracle Admin role to Collateralization Oracle Guardian
6. Seed TRIBE to LBP Swapper

*/

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    fei,
    tribe,
    feiEthPair,
    weth,
    chainlinkEthUsdOracleWrapper,
    chainlinkRaiUsdCompositOracle,
    chainlinkDaiUsdOracleWrapper,
    compositeOracle,
    chainlinkDpiUsdOracleWrapper,
    dai,
    dpi,
    rai,
    proxyAdmin,
    erc20Dripper,
    balancerLBPoolFactory,
    rariPool19DpiPCVDepositWrapper,
    dpiBondingCurveWrapper,
    ethReserveStabilizerWrapper,
    aaveRaiPCVDepositWrapper,
    compoundDaiPCVDepositWrapper,
    ethLidoPCVDepositWrapper,
    rariPool9RaiPCVDepositWrapper,
    raiBondingCurveWrapper,
    daiBondingCurveWrapper,
    bondingCurve,
    dpiUniswapPCVDeposit,
    uniswapPCVDeposit,
    compoundEthPCVDepositWrapper,
    aaveEthPCVDepositWrapper,
    rariPool8FeiPCVDepositWrapper,
    rariPool7FeiPCVDepositWrapper,
    rariPool6FeiPCVDepositWrapper,
    rariPool9FeiPCVDepositWrapper,
    rariPool19FeiPCVDepositWrapper,
    rariPool18FeiPCVDepositWrapper,
    rariPool24FeiPCVDepositWrapper,
    rariPool25FeiPCVDepositWrapper,
    rariPool26FeiPCVDepositWrapper,
    rariPool27FeiPCVDepositWrapper,
    creamFeiPCVDepositWrapper,
    staticPcvDepositWrapper
  } = addresses;

  const {
    uniswapRouter: uniswapRouterAddress,
    sushiswapRouter: sushiswapRouterAddress,
    chainlinkTribeEthOracle: chainlinkTribeEthOracleAddress
  } = getAllContractAddresses();

  if (!core || !feiEthPair || !weth || !uniswapRouterAddress || !chainlinkEthUsdOracleWrapper || !compositeOracle) {
    console.log(`core: ${core}`);
    console.log(`feiEtiPair: ${feiEthPair}`);
    console.log(`weth: ${weth}`);
    console.log(`uniswapRouter: ${uniswapRouterAddress}`);
    console.log(`chainlinkEthUsdOracleWrapper: ${chainlinkEthUsdOracleWrapper}`);
    console.log(`compositeOracle: ${compositeOracle}`);

    throw new Error('An environment variable contract address is not set');
  }

  // ----------- Collateralization Contracts ---------------

  const constantOracleFactory = await ethers.getContractFactory('ConstantOracle');

  const zeroConstantOracle = await constantOracleFactory.deploy(core, 0);
  logging && console.log('zeroConstantOracle: ', zeroConstantOracle.address);

  const oneConstantOracle = await constantOracleFactory.deploy(core, 10000);
  logging && console.log('oneConstantOracle: ', oneConstantOracle.address);

  const collateralizationOracleFactory = await ethers.getContractFactory('CollateralizationOracle');
  const collateralizationOracle = await collateralizationOracleFactory.deploy(
    core,
    [
      rariPool19DpiPCVDepositWrapper,
      dpiBondingCurveWrapper,
      ethReserveStabilizerWrapper,
      aaveRaiPCVDepositWrapper,
      compoundDaiPCVDepositWrapper,
      ethLidoPCVDepositWrapper,
      rariPool9RaiPCVDepositWrapper,
      raiBondingCurveWrapper,
      daiBondingCurveWrapper,
      bondingCurve,
      dpiUniswapPCVDeposit,
      uniswapPCVDeposit,
      compoundEthPCVDepositWrapper,
      aaveEthPCVDepositWrapper,
      rariPool8FeiPCVDepositWrapper,
      rariPool7FeiPCVDepositWrapper,
      rariPool6FeiPCVDepositWrapper,
      rariPool9FeiPCVDepositWrapper,
      rariPool19FeiPCVDepositWrapper,
      rariPool18FeiPCVDepositWrapper,
      rariPool24FeiPCVDepositWrapper,
      rariPool25FeiPCVDepositWrapper,
      rariPool26FeiPCVDepositWrapper,
      rariPool27FeiPCVDepositWrapper,
      creamFeiPCVDepositWrapper,
      staticPcvDepositWrapper
    ],
    [dai, dpi, weth, rai, fei, USD_ADDRESS],
    [
      chainlinkDaiUsdOracleWrapper,
      chainlinkDpiUsdOracleWrapper,
      chainlinkEthUsdOracleWrapper,
      chainlinkRaiUsdCompositOracle,
      zeroConstantOracle.address,
      oneConstantOracle.address
    ]
  );

  logging && console.log('Collateralization Oracle: ', collateralizationOracle.address);

  const collateralizationOracleWrapperImplFactory = await ethers.getContractFactory('CollateralizationOracleWrapper');
  const collateralizationOracleWrapperImpl = await collateralizationOracleWrapperImplFactory.deploy(
    core,
    1 // not used
  );

  logging && console.log('Collateralization Oracle Wrapper Impl: ', collateralizationOracleWrapperImpl.address);

  // This initialize calldata gets atomically executed against the impl logic
  // upon construction of the proxy
  const collateralizationOracleWrapperInterface = collateralizationOracleWrapperImpl.interface;
  const calldata = collateralizationOracleWrapperInterface.encodeFunctionData('initialize', [core, collateralizationOracle.address, CR_WRAPPER_DURATION, CR_WRAPPER_DEVIATION_BPS]);

  const ProxyFactory = await ethers.getContractFactory('TransparentUpgradeableProxy');
  const proxy = await ProxyFactory.deploy(collateralizationOracleWrapperImpl.address, proxyAdmin, calldata);

  const collateralizationOracleWrapper = await ethers.getContractAt('CollateralizationOracleWrapper', proxy.address);

  logging && console.log('Collateralization Oracle Wrapper Proxy: ', collateralizationOracleWrapper.address);

  const collateralizationOracleKeeperFactory = await ethers.getContractFactory('CollateralizationOracleKeeper');
  const collateralizationOracleKeeper = await collateralizationOracleKeeperFactory.deploy(
    core,
    CR_KEEPER_INCENTIVE,
    collateralizationOracleWrapper.address
  );

  logging && console.log('Collateralization Oracle Keeper: ', collateralizationOracleKeeper.address);

  // ----------- New Contracts ---------------

  const chainlinkTribeEthOracleWrapperFactory = await ethers.getContractFactory('ChainlinkOracleWrapper');
  const chainlinkTribeEthOracleWrapper = await chainlinkTribeEthOracleWrapperFactory.deploy(
    core,
    chainlinkTribeEthOracleAddress
  );

  logging && console.log('TRIBE/ETH Oracle Wrapper deployed to: ', chainlinkTribeEthOracleWrapper.address);

  const chainlinkTribeUsdCompositeOracleFactory = await ethers.getContractFactory('CompositeOracle');
  const chainlinkTribeUsdCompositeOracle = await chainlinkTribeUsdCompositeOracleFactory.deploy(
    core,
    chainlinkTribeEthOracleWrapper.address,
    chainlinkEthUsdOracleWrapper
  );

  logging && console.log('TRIBE/USD Composite Oracle deployed to: ', chainlinkTribeUsdCompositeOracle.address);

  const tribeReserveStabilizerFactory = await ethers.getContractFactory('TribeReserveStabilizer');
  const tribeReserveStabilizer = await tribeReserveStabilizerFactory.deploy(
    core,
    chainlinkTribeUsdCompositeOracle.address,
    ethers.constants.AddressZero,
    USD_PER_FEI_BPS,
    collateralizationOracleWrapper.address,
    CR_THRESHOLD_BPS,
    MAX_RESERVE_STABILIZER_MINT_RATE,
    RESERVE_STABILIZER_MINT_RATE,
    TRIBE_BUFFER_CAP
  );

  logging && console.log('TRIBE Reserve Stabilizer: ', tribeReserveStabilizer.address);

  // ERC20Splitter
  const tribeSplitterFactory = await ethers.getContractFactory('ERC20Splitter');
  const tribeSplitter = await tribeSplitterFactory.deploy(
    core,
    tribe,
    [tribeReserveStabilizer.address, core, erc20Dripper],
    [SPLIT_BURN_BPS, SPLIT_DAO_BPS, SPLIT_LM_BPS]
  );

  logging && console.log('TRIBE Splitter: ', tribeSplitter.address);

  const feiTribeLBPSwapperFactory = await ethers.getContractFactory('BalancerLBPSwapper');
  const feiTribeLBPSwapper = await feiTribeLBPSwapperFactory.deploy(
    core,
    {
      _oracle: chainlinkTribeUsdCompositeOracle.address,
      _backupOracle: ethers.constants.AddressZero,
      _invertOraclePrice: false, // TODO check this
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    fei,
    tribe,
    tribeSplitter.address,
    MIN_LBP_SIZE
  );

  logging && console.log('FEI->TRIBE LBP Swapper: ', feiTribeLBPSwapper.address);

  const lbpFactory = await ethers.getContractAt('ILiquidityBootstrappingPoolFactory', balancerLBPoolFactory);

  const tx: TransactionResponse = await lbpFactory.create(
    'FEI->TRIBE Auction Pool',
    'apFEI-TRIBE',
    [fei, tribe],
    [`99${e16}`, `1${e16}`],
    `30${e14}`,
    feiTribeLBPSwapper.address,
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt;
  const feiTribeLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to: ', feiTribeLBPAddress);

  await feiTribeLBPSwapper.init(feiTribeLBPAddress);

  const pcvEquityMinterFactory = await ethers.getContractFactory('PCVEquityMinter');
  const pcvEquityMinter = await pcvEquityMinterFactory.deploy(
    core,
    feiTribeLBPSwapper.address,
    PCV_EQUITY_MINTER_INCENTIVE,
    PCV_EQUITY_MINTER_FREQUENCY,
    collateralizationOracleWrapper.address,
    PCV_EQUITY_MINTER_APR_BPS
  );

  logging && console.log('PCV Equity Minter: ', pcvEquityMinter.address);

  return {
    collateralizationOracle,
    collateralizationOracleWrapperImpl,
    collateralizationOracleWrapper,
    collateralizationOracleKeeper,
    chainlinkTribeEthOracleWrapper,
    chainlinkTribeUsdCompositeOracle,
    tribeReserveStabilizer,
    tribeSplitter,
    feiTribeLBPSwapper,
    pcvEquityMinter
  } as NamedContracts;
}