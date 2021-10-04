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

export const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    fei,
    tribe,
    feiEthPair,
    sushiswapDpiFei,
    weth,
    chainlinkEthUsdOracleWrapper,
    chainlinkRaiUsdCompositOracle,
    chainlinkDaiUsdOracleWrapper,
    compositeOracle,
    aaveEthPCVDeposit,
    compoundEthPCVDeposit,
    chainlinkDpiUsdOracleWrapper,
    daiBondingCurve,
    dpiBondingCurve,
    raiBondingCurve,
    ethReserveStabilizer,
    rariPool8FeiPCVDeposit,
    rariPool7FeiPCVDeposit,
    rariPool6FeiPCVDeposit,
    rariPool9FeiPCVDeposit,
    rariPool19DpiPCVDeposit,
    rariPool19FeiPCVDeposit,
    rariPool18FeiPCVDeposit,
    rariPool24FeiPCVDeposit,
    rariPool25FeiPCVDeposit,
    rariPool26FeiPCVDeposit,
    rariPool27FeiPCVDeposit,
    rariPool9RaiPCVDeposit,
    creamFeiPCVDeposit,
    compoundDaiPCVDeposit,
    aaveRaiPCVDeposit,
    ethLidoPCVDeposit,
    dai,
    dpi,
    rai,
    proxyAdmin,
    erc20Dripper,
    balancerLBPoolFactory
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

  // ----------- Replacement Contracts ---------------
  const uniswapPCVDepositFactory = await ethers.getContractFactory('UniswapPCVDeposit');
  const uniswapPCVDeposit = await uniswapPCVDepositFactory.deploy(
    core,
    feiEthPair,
    uniswapRouterAddress,
    chainlinkEthUsdOracleWrapper,
    ethers.constants.AddressZero,
    '100'
  );

  logging && console.log('ETH UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address);

  const dpiUniswapPCVDepositFactory = await ethers.getContractFactory('UniswapPCVDeposit')
  
  const dpiUniswapPCVDeposit = await dpiUniswapPCVDepositFactory.deploy(
    core,
    sushiswapDpiFei,
    sushiswapRouterAddress,
    chainlinkDpiUsdOracleWrapper,
    ethers.constants.AddressZero,
    '100'
  );

  logging && console.log('DPI UniswapPCVDeposit deployed to: ', dpiUniswapPCVDeposit.address);

  const bondingCurveFactory = await ethers.getContractFactory('EthBondingCurve');
  const bondingCurve = await bondingCurveFactory.deploy(core, chainlinkEthUsdOracleWrapper, ethers.constants.AddressZero, {
    scale: SCALE,
    buffer: BUFFER,
    discount: DISCOUNT,
    pcvDeposits: [aaveEthPCVDeposit, compoundEthPCVDeposit],
    ratios: [5000, 5000],
    duration: BC_DURATION,
    incentive: BC_INCENTIVE
  });

  logging && console.log('Bonding curve deployed to: ', bondingCurve.address);

  const ratioPCVControllerFactory = await ethers.getContractFactory('RatioPCVController');
  const ratioPCVController = await ratioPCVControllerFactory.deploy(core);

  logging && console.log('Ratio PCV controller', ratioPCVController.address);

  // ----------- PCV Deposit Wrapper Contracts ---------------

  const daiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper')
  const daiBondingCurveWrapper = await daiBondingCurveWrapperFactory.deploy(daiBondingCurve, dai, false);

  logging && console.log('daiBondingCurveWrapper: ', daiBondingCurveWrapper.address);

  const compoundDaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');

  const compoundDaiPCVDepositWrapper = await compoundDaiPCVDepositWrapperFactory.deploy(
    compoundDaiPCVDeposit,
    dai,
    false
  );

  logging && console.log('compoundDaiPCVDepositWrapper: ', compoundDaiPCVDepositWrapper.address);

  const raiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const raiBondingCurveWrapper = await raiBondingCurveWrapperFactory.deploy(raiBondingCurve, rai, false);

  logging && console.log('raiBondingCurveWrapper: ', raiBondingCurveWrapper.address);

  const aaveRaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const aaveRaiPCVDepositWrapper = await aaveRaiPCVDepositWrapperFactory.deploy(aaveRaiPCVDeposit, rai, false);

  logging && console.log('aaveRaiPCVDeposit: ', aaveRaiPCVDepositWrapper.address);

  const rariPool9RaiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool9RaiPCVDepositWrapper = await rariPool9RaiPCVDepositWrapperFactory.deploy(
    rariPool9RaiPCVDeposit,
    rai,
    false
  );

  logging && console.log('rariPool9RaiPCVDepositWrapper: ', rariPool9RaiPCVDepositWrapper.address);

  const dpiBondingCurveWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const dpiBondingCurveWrapper = await dpiBondingCurveWrapperFactory.deploy(dpiBondingCurve, dpi, false);

  logging && console.log('dpiBondingCurveWrapper: ', dpiBondingCurveWrapper.address);

  const rariPool19DpiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool19DpiPCVDepositWrapper = await rariPool19DpiPCVDepositWrapperFactory.deploy(
    rariPool19DpiPCVDeposit,
    dpi,
    false
  );

  logging && console.log('rariPool19DpiPCVDepositWrapper: ', rariPool19DpiPCVDepositWrapper.address);

  const ethReserveStabilizerWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const ethReserveStabilizerWrapper = await ethReserveStabilizerWrapperFactory.deploy(
    ethReserveStabilizer,
    weth,
    false
  );

  logging && console.log('ethReserveStabilizerWrapper: ', ethReserveStabilizerWrapper.address);

  const ethLidoPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const ethLidoPCVDepositWrapper = await ethLidoPCVDepositWrapperFactory.deploy(ethLidoPCVDeposit, weth, false);

  logging && console.log('ethLidoPCVDepositWrapper: ', ethLidoPCVDepositWrapper.address);

  const aaveEthPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const aaveEthPCVDepositWrapper = await aaveEthPCVDepositWrapperFactory.deploy(aaveEthPCVDeposit, weth, false);

  logging && console.log('aaveEthPCVDepositWrapper: ', aaveEthPCVDepositWrapper.address);

  const compoundEthPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const compoundEthPCVDepositWrapper = await compoundEthPCVDepositWrapperFactory.deploy(
    compoundEthPCVDeposit,
    weth,
    false
  );

  logging && console.log('compoundEthPCVDepositWrapper: ', compoundEthPCVDepositWrapper.address);

  // ----------- FEI PCV Deposit Wrapper Contracts ---------------

  const rariPool8FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool8FeiPCVDepositWrapper = await rariPool8FeiPCVDepositWrapperFactory.deploy(
    rariPool8FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool8FeiPCVDepositWrapper: ', rariPool8FeiPCVDepositWrapper.address);

  const rariPool9FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool9FeiPCVDepositWrapper = await rariPool9FeiPCVDepositWrapperFactory.deploy(
    rariPool9FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool9FeiPCVDepositWrapper: ', rariPool9FeiPCVDepositWrapper.address);

  const rariPool7FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool7FeiPCVDepositWrapper = await rariPool7FeiPCVDepositWrapperFactory.deploy(
    rariPool7FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool7FeiPCVDepositWrapper: ', rariPool7FeiPCVDepositWrapper.address);

  const rariPool6FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool6FeiPCVDepositWrapper = await rariPool6FeiPCVDepositWrapperFactory.deploy(
    rariPool6FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool6FeiPCVDepositWrapper: ', rariPool6FeiPCVDepositWrapper.address);

  const rariPool19FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool19FeiPCVDepositWrapper = await rariPool19FeiPCVDepositWrapperFactory.deploy(
    rariPool19FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool19FeiPCVDepositWrapper: ', rariPool19FeiPCVDepositWrapper.address);

  const rariPool24FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool24FeiPCVDepositWrapper = await rariPool24FeiPCVDepositWrapperFactory.deploy(
    rariPool24FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool24FeiPCVDepositWrapper: ', rariPool24FeiPCVDepositWrapper.address);

  const rariPool25FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool25FeiPCVDepositWrapper = await rariPool25FeiPCVDepositWrapperFactory.deploy(
    rariPool25FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool25FeiPCVDepositWrapper: ', rariPool25FeiPCVDepositWrapper.address);

  const rariPool26FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool26FeiPCVDepositWrapper = await rariPool26FeiPCVDepositWrapperFactory.deploy(
    rariPool26FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool26FeiPCVDepositWrapper: ', rariPool26FeiPCVDepositWrapper.address);

  const rariPool27FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool27FeiPCVDepositWrapper = await rariPool27FeiPCVDepositWrapperFactory.deploy(
    rariPool27FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool27FeiPCVDepositWrapper: ', rariPool27FeiPCVDepositWrapper.address);

  const rariPool18FeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const rariPool18FeiPCVDepositWrapper = await rariPool18FeiPCVDepositWrapperFactory.deploy(
    rariPool18FeiPCVDeposit,
    fei,
    true
  );

  logging && console.log('rariPool18FeiPCVDepositWrapper: ', rariPool18FeiPCVDepositWrapper.address);

  const creamFeiPCVDepositWrapperFactory = await ethers.getContractFactory('PCVDepositWrapper');
  const creamFeiPCVDepositWrapper = await creamFeiPCVDepositWrapperFactory.deploy(creamFeiPCVDeposit, fei, true);

  logging && console.log('creamFeiPCVDepositWrapper: ', creamFeiPCVDepositWrapper.address);

  const staticPcvDepositWrapperFactory = await ethers.getContractFactory('StaticPCVDepositWrapper');
  const staticPcvDepositWrapper = await staticPcvDepositWrapperFactory.deploy(
    core,
    toBN(4000000).mul(ethers.constants.WeiPerEther).toString(), // 4M PCV for 100k INDEX @ ~$40
    toBN(8500000).mul(ethers.constants.WeiPerEther).toString() // 8.5M FEI in Kashi
  );

  logging && console.log('staticPcvDepositWrapper: ', staticPcvDepositWrapper.address);

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
      rariPool19DpiPCVDepositWrapper.address,
      dpiBondingCurveWrapper.address,
      ethReserveStabilizerWrapper.address,
      aaveRaiPCVDepositWrapper.address,
      compoundDaiPCVDepositWrapper.address,
      ethLidoPCVDepositWrapper.address,
      rariPool9RaiPCVDepositWrapper.address,
      raiBondingCurveWrapper.address,
      daiBondingCurveWrapper.address,
      bondingCurve.address,
      dpiUniswapPCVDeposit.address,
      uniswapPCVDeposit.address,
      compoundEthPCVDepositWrapper.address,
      aaveEthPCVDepositWrapper.address,
      rariPool8FeiPCVDepositWrapper.address,
      rariPool7FeiPCVDepositWrapper.address,
      rariPool6FeiPCVDepositWrapper.address,
      rariPool9FeiPCVDepositWrapper.address,
      rariPool19FeiPCVDepositWrapper.address,
      rariPool18FeiPCVDepositWrapper.address,
      rariPool24FeiPCVDepositWrapper.address,
      rariPool25FeiPCVDepositWrapper.address,
      rariPool26FeiPCVDepositWrapper.address,
      rariPool27FeiPCVDepositWrapper.address,
      creamFeiPCVDepositWrapper.address,
      staticPcvDepositWrapper.address
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
    uniswapPCVDeposit,
    dpiUniswapPCVDeposit,
    bondingCurve,
    ratioPCVController,
    daiBondingCurveWrapper,
    compoundDaiPCVDepositWrapper,
    raiBondingCurveWrapper,
    aaveRaiPCVDepositWrapper,
    rariPool9RaiPCVDepositWrapper,
    dpiBondingCurveWrapper,
    rariPool19DpiPCVDepositWrapper,
    ethReserveStabilizerWrapper,
    collateralizationOracle,
    collateralizationOracleWrapperImpl,
    collateralizationOracleWrapper,
    collateralizationOracleKeeper,
    chainlinkTribeEthOracleWrapper,
    chainlinkTribeUsdCompositeOracle,
    tribeReserveStabilizer,
    tribeSplitter,
    feiTribeLBPSwapper,
    pcvEquityMinter,
    staticPcvDepositWrapper
  } as NamedContracts;
};