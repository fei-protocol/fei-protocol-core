import { TransactionResponse } from '@ethersproject/abstract-provider';
import testHelpers, { BN, ether } from '@openzeppelin/test-helpers';
import hre, { artifacts, ethers, web3 } from 'hardhat';
import { getAllContractAddresses } from '../../test/integration/setup/loadContracts';
import { DeployUpgradeFunc, NamedContracts } from '../../test/integration/setup/types';
const { constants: { ZERO_ADDRESS } } = testHelpers;

const UniswapPCVDeposit = artifacts.readArtifactSync('UniswapPCVDeposit');
const EthBondingCurve = artifacts.readArtifactSync('EthBondingCurve');
const TribeReserveStabilizer = artifacts.readArtifactSync('TribeReserveStabilizer');
const RatioPCVController = artifacts.readArtifactSync('RatioPCVController');
const CollateralizationOracleKeeper = artifacts.readArtifactSync('CollateralizationOracleKeeper');
const CollateralizationOracle = artifacts.readArtifactSync('CollateralizationOracle');
const CollateralizationOracleWrapper = artifacts.readArtifactSync('CollateralizationOracleWrapper');
const TransparentUpgradeableProxy = artifacts.readArtifactSync('TransparentUpgradeableProxy');
const PCVEquityMinter = artifacts.readArtifactSync('PCVEquityMinter');
const ERC20Splitter = artifacts.readArtifactSync('ERC20Splitter');
const PCVDepositWrapper = artifacts.readArtifactSync('PCVDepositWrapper');
const StaticPCVDepositWrapper = artifacts.readArtifactSync('StaticPCVDepositWrapper');
const BalancerLBPSwapper = artifacts.readArtifactSync('BalancerLBPSwapper');
const ChainlinkOracleWrapper = artifacts.readArtifactSync('ChainlinkOracleWrapper');
const CompositeOracle = artifacts.readArtifactSync('CompositeOracle');
const ConstantOracle = artifacts.readArtifactSync('ConstantOracle');
const ILiquidityBootstrappingPoolFactory = artifacts.readArtifactSync('ILiquidityBootstrappingPoolFactory');

// Constants
const e18 = '000000000000000000';
const e16 = '0000000000000000';
const e14 = '00000000000000';

// CR oracle wrapper
const CR_WRAPPER_DURATION = '60'; // 1 minute
const CR_WRAPPER_DEVIATION_BPS = '500'; // 5%
const CR_KEEPER_INCENTIVE = `1000${e18}`; // 1000 FEI

// Tribe reserve stabilizer
const USD_PER_FEI_BPS = '10000'; // $1 FEI
const CR_THRESHOLD_BPS = '10000'; // 100% CR
const MAX_RESERVE_STABILIZER_MINT_RATE = `1000${e18}`; // 1000 TRIBE/s
const RESERVE_STABILIZER_MINT_RATE = `100${e18}`; // 100 TRIBE/s
const TRIBE_BUFFER_CAP = `5000000${e18}`; // 5M TRIBE 

// LBP swapper
const LBP_FREQUENCY = '604800'; // weekly
const MIN_LBP_SIZE = `100000${e18}`; // 100k FEI

// PCV Equity Minter
const PCV_EQUITY_MINTER_INCENTIVE = `1000${e18}`; // 1000 FEI
const PCV_EQUITY_MINTER_FREQUENCY = '604800'; // weekly
const PCV_EQUITY_MINTER_APR_BPS = '1000'; // 10%

// ERC20Splitter
const SPLIT_DAO_BPS = '2000'; // 20%
const SPLIT_LM_BPS = '2000'; // 20%
const SPLIT_BURN_BPS = '6000'; // 60%

// ETH Bonding Curve 
const SCALE = `1${e18}`; // 1 FEI
const BUFFER = '50'; // 0.5%
const DISCOUNT = '0'; // 0%
const BC_DURATION = '86400'; // 1w
const BC_INCENTIVE = `500${e18}`;

const USD_ADDRESS = '0x1111111111111111111111111111111111111111';

const deploy: DeployUpgradeFunc = async (deployAddress, addresses, logging = false) => {
  const {
    core,
    fei,
    tribe,
    feiEthPair,
    sushiswapDpiFei,
    weth,
    sushiswapRouter,
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
  } = getAllContractAddresses()

  if (
    !core || !feiEthPair || !weth || !uniswapRouterAddress || !chainlinkEthUsdOracleWrapper || !compositeOracle
  ) {
    console.log(`core: ${core.address}`)
    console.log(`feiEtiPair: ${feiEthPair.address}`)
    console.log(`weth: ${weth.address}`)
    console.log(`uniswapRouter: ${uniswapRouterAddress}`)
    console.log(`chainlinkEthUsdOracleWrapper: ${chainlinkEthUsdOracleWrapper.address}`)
    console.log(`compositeOracle: ${compositeOracle.address}`)

    throw new Error('An environment variable contract address is not set');
  }

  // ----------- Replacement Contracts ---------------
  const uniswapPCVDepositFactory = await ethers.getContractFactory(UniswapPCVDeposit.abi, UniswapPCVDeposit.bytecode);
  const uniswapPCVDeposit = await uniswapPCVDepositFactory.deploy(
    core.address,
    feiEthPair.address,
    uniswapRouterAddress, 
    chainlinkEthUsdOracleWrapper.address,
    ZERO_ADDRESS,
    '100'
  );
  
  logging && console.log('ETH UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address);
  
  const dpiUniswapPCVDepositFactory = await ethers.getContractFactory(UniswapPCVDeposit.abi, UniswapPCVDeposit.bytecode);
  const dpiUniswapPCVDeposit = await dpiUniswapPCVDepositFactory.deploy(
    core.address,
    sushiswapDpiFei.address,
    sushiswapRouterAddress, 
    chainlinkDpiUsdOracleWrapper.address,
    ZERO_ADDRESS,
    '100',
  );
  logging && console.log('DPI UniswapPCVDeposit deployed to: ', dpiUniswapPCVDeposit.address);

  const bondingCurveFactory = await ethers.getContractFactory(EthBondingCurve.abi, EthBondingCurve.bytecode);
  const bondingCurve = await bondingCurveFactory.deploy(      
    core.address,
    chainlinkEthUsdOracleWrapper.address,
    ZERO_ADDRESS,
    {
      scale: SCALE, 
      buffer: BUFFER, 
      discount: DISCOUNT, 
      pcvDeposits: [aaveEthPCVDeposit.address, compoundEthPCVDeposit.address], 
      ratios: [5000, 5000], 
      duration: BC_DURATION, 
      incentive: BC_INCENTIVE
    },
  );
  logging && console.log('Bonding curve deployed to: ', bondingCurve.address);
  
  const ratioPCVControllerFactory = await ethers.getContractFactory(RatioPCVController.abi, RatioPCVController.bytecode);
  const ratioPCVController = await ratioPCVControllerFactory.deploy(
    core.address
  );
  
  logging && console.log('Ratio PCV controller', ratioPCVController.address);

  // ----------- PCV Deposit Wrapper Contracts ---------------

  const daiBondingCurveWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const daiBondingCurveWrapper = await daiBondingCurveWrapperFactory.deploy(
    daiBondingCurve.address,
    dai.address,
    false
  );

  logging && console.log('daiBondingCurveWrapper: ', daiBondingCurveWrapper.address);

  const compoundDaiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const compoundDaiPCVDepositWrapper = await compoundDaiPCVDepositWrapperFactory.deploy(
    compoundDaiPCVDeposit.address,
    dai.address,
    false
  );

  logging && console.log('compoundDaiPCVDepositWrapper: ', compoundDaiPCVDepositWrapper.address);

  const raiBondingCurveWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const raiBondingCurveWrapper = await raiBondingCurveWrapperFactory.deploy(
    raiBondingCurve.address,
    rai.address,
    false
  );

  logging && console.log('raiBondingCurveWrapper: ', raiBondingCurveWrapper.address);

  const aaveRaiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const aaveRaiPCVDepositWrapper = await aaveRaiPCVDepositWrapperFactory.deploy(
    aaveRaiPCVDeposit.address,
    rai.address,
    false
  );

  logging && console.log('aaveRaiPCVDeposit: ', aaveRaiPCVDepositWrapper.address);

  const rariPool9RaiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool9RaiPCVDepositWrapper = await rariPool9RaiPCVDepositWrapperFactory.deploy(
    rariPool9RaiPCVDeposit.address,
    rai.address,
    false
  );

  logging && console.log('rariPool9RaiPCVDepositWrapper: ', rariPool9RaiPCVDepositWrapper.address);

  const dpiBondingCurveWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const dpiBondingCurveWrapper = await dpiBondingCurveWrapperFactory.deploy(
    dpiBondingCurve.address,
    dpi.address,
    false
  );

  logging && console.log('dpiBondingCurveWrapper: ', dpiBondingCurveWrapper.address);

  const rariPool19DpiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool19DpiPCVDepositWrapper = await rariPool19DpiPCVDepositWrapperFactory.deploy(
    rariPool19DpiPCVDeposit.address,
    dpi.address,
    false
  );

  logging && console.log('rariPool19DpiPCVDepositWrapper: ', rariPool19DpiPCVDepositWrapper.address);

  const ethReserveStabilizerWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const ethReserveStabilizerWrapper = await ethReserveStabilizerWrapperFactory.deploy(
    ethReserveStabilizer.address,
    weth.address,
    false
  );

  logging && console.log('ethReserveStabilizerWrapper: ', ethReserveStabilizerWrapper.address);

  const ethLidoPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const ethLidoPCVDepositWrapper = await ethLidoPCVDepositWrapperFactory.deploy(
    ethLidoPCVDeposit.address,
    weth.address,
    false
  );

  logging && console.log('ethLidoPCVDepositWrapper: ', ethLidoPCVDepositWrapper.address);
  
  const aaveEthPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const aaveEthPCVDepositWrapper = await aaveEthPCVDepositWrapperFactory.deploy(
    aaveEthPCVDeposit.address,
    weth.address,
    false
  );

  logging && console.log('aaveEthPCVDepositWrapper: ', aaveEthPCVDepositWrapper.address);

  const compoundEthPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const compoundEthPCVDepositWrapper = await compoundEthPCVDepositWrapperFactory.deploy(
    compoundEthPCVDeposit.address,
    weth.address,
    false
  );

  logging && console.log('compoundEthPCVDepositWrapper: ', compoundEthPCVDepositWrapper.address);

  // ----------- FEI PCV Deposit Wrapper Contracts ---------------

  const rariPool8FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool8FeiPCVDepositWrapper = await rariPool8FeiPCVDepositWrapperFactory.deploy(
    rariPool8FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool8FeiPCVDepositWrapper: ', rariPool8FeiPCVDepositWrapper.address);

  const rariPool9FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool9FeiPCVDepositWrapper = await rariPool9FeiPCVDepositWrapperFactory.deploy(
    rariPool9FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool9FeiPCVDepositWrapper: ', rariPool9FeiPCVDepositWrapper.address);

  const rariPool7FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool7FeiPCVDepositWrapper = await rariPool7FeiPCVDepositWrapperFactory.deploy(
    rariPool7FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool7FeiPCVDepositWrapper: ', rariPool7FeiPCVDepositWrapper.address);

  const rariPool6FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool6FeiPCVDepositWrapper = await rariPool6FeiPCVDepositWrapperFactory.deploy(
    rariPool6FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool6FeiPCVDepositWrapper: ', rariPool6FeiPCVDepositWrapper.address);

  const rariPool19FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool19FeiPCVDepositWrapper = await rariPool19FeiPCVDepositWrapperFactory.deploy(
    rariPool19FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool19FeiPCVDepositWrapper: ', rariPool19FeiPCVDepositWrapper.address);

  const rariPool24FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool24FeiPCVDepositWrapper = await rariPool24FeiPCVDepositWrapperFactory.deploy(
    rariPool24FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool24FeiPCVDepositWrapper: ', rariPool24FeiPCVDepositWrapper.address);

  const rariPool25FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool25FeiPCVDepositWrapper = await rariPool25FeiPCVDepositWrapperFactory.deploy(
    rariPool25FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool25FeiPCVDepositWrapper: ', rariPool25FeiPCVDepositWrapper.address);

  const rariPool26FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool26FeiPCVDepositWrapper = await rariPool26FeiPCVDepositWrapperFactory.deploy(
    rariPool26FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool26FeiPCVDepositWrapper: ', rariPool26FeiPCVDepositWrapper.address);

  const rariPool27FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool27FeiPCVDepositWrapper = await rariPool27FeiPCVDepositWrapperFactory.deploy(
    rariPool27FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool27FeiPCVDepositWrapper: ', rariPool27FeiPCVDepositWrapper.address);

  const rariPool18FeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const rariPool18FeiPCVDepositWrapper = await rariPool18FeiPCVDepositWrapperFactory.deploy(
    rariPool18FeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('rariPool18FeiPCVDepositWrapper: ', rariPool18FeiPCVDepositWrapper.address);

  const creamFeiPCVDepositWrapperFactory = await ethers.getContractFactory(PCVDepositWrapper.abi, PCVDepositWrapper.bytecode);
  const creamFeiPCVDepositWrapper = await creamFeiPCVDepositWrapperFactory.deploy(
    creamFeiPCVDeposit.address,
    fei.address,
    true
  );

  logging && console.log('creamFeiPCVDepositWrapper: ', creamFeiPCVDepositWrapper.address);

  const staticPcvDepositWrapperFactory = await ethers.getContractFactory(StaticPCVDepositWrapper.abi, StaticPCVDepositWrapper.bytecode);
  const staticPcvDepositWrapper = await staticPcvDepositWrapperFactory.deploy(
    core.address,
    `4000000${e18}`, // 4M PCV for 100k INDEX @ ~$40
    `8500000${e18}` // 8.5M FEI in Kashi
  );

  logging && console.log('staticPcvDepositWrapper: ', staticPcvDepositWrapper.address);

  // ----------- Collateralization Contracts ---------------

  const constantOracleFactory = await ethers.getContractFactory(ConstantOracle.abi, ConstantOracle.bytecode);

  const zeroConstantOracle = await constantOracleFactory.deploy(core.address, 0);
  logging && console.log('zeroConstantOracle: ', zeroConstantOracle.address);

  const oneConstantOracle = await constantOracleFactory.deploy(core.address, 10000);
  logging && console.log('oneConstantOracle: ', oneConstantOracle.address);

  const collateralizationOracleFactory = await ethers.getContractFactory(CollateralizationOracle.abi, CollateralizationOracle.bytecode);
  const collateralizationOracle = await collateralizationOracleFactory.deploy(
    core.address,
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
    [dai.address, dpi.address, weth.address, rai.address, fei.address, USD_ADDRESS],
    [
      chainlinkDaiUsdOracleWrapper.address, 
      chainlinkDpiUsdOracleWrapper.address, 
      chainlinkEthUsdOracleWrapper.address, 
      chainlinkRaiUsdCompositOracle.address,
      zeroConstantOracle.address,
      oneConstantOracle.address
    ],
  );

  logging && console.log('Collateralization Oracle: ', collateralizationOracle.address);

  const collateralizationOracleWrapperImplFactory = await ethers.getContractFactory(CollateralizationOracleWrapper.abi, CollateralizationOracleWrapper.bytecode);
  const collateralizationOracleWrapperImpl = await collateralizationOracleWrapperImplFactory.deploy(
    core.address,
    1, // not used
  );

  logging && console.log('Collateralization Oracle Wrapper Impl: ', collateralizationOracleWrapperImpl.address);
  
  // This initialize calldata gets atomically executed against the impl logic 
  // upon construction of the proxy
  const calldata = web3.eth.abi.encodeFunctionCall({
    name: 'initialize',
    type: 'function',
    inputs: [{
      type: 'address',
      name: '_core'
    }, {
      type: 'address',
      name: '_collateralizationOracle'
    }, {
      type: 'uint256',
      name: '_validityDuration'
    }, {
      type: 'uint256',
      name: '_deviationThresholdBasisPoints'
    }]
  }, [core.address, collateralizationOracle.address, CR_WRAPPER_DURATION, CR_WRAPPER_DEVIATION_BPS]);

  const ProxyFactory = await ethers.getContractFactory(TransparentUpgradeableProxy.abi, TransparentUpgradeableProxy.bytecode);
  const proxy = await ProxyFactory.deploy(
    collateralizationOracleWrapperImpl.address,
    proxyAdmin.address,
    calldata,
  );

  const collateralizationOracleWrapper = await ethers.getContractAt(CollateralizationOracleWrapper.abi, proxy.address)

  logging && console.log('Collateralization Oracle Wrapper Proxy: ', collateralizationOracleWrapper.address);

  const collateralizationOracleKeeperFactory = await ethers.getContractFactory(CollateralizationOracleKeeper.abi, CollateralizationOracleKeeper.bytecode);
  const collateralizationOracleKeeper = await collateralizationOracleKeeperFactory.deploy(
    core.address,
    CR_KEEPER_INCENTIVE,
    collateralizationOracleWrapper.address
  );

  logging && console.log('Collateralization Oracle Keeper: ', collateralizationOracleKeeper.address);

  // ----------- New Contracts ---------------

  const chainlinkTribeEthOracleWrapperFactory = await ethers.getContractFactory(ChainlinkOracleWrapper.abi, ChainlinkOracleWrapper.bytecode);
  const chainlinkTribeEthOracleWrapper = await chainlinkTribeEthOracleWrapperFactory.deploy(
    core.address, 
    chainlinkTribeEthOracleAddress,
  );

  logging && console.log('TRIBE/ETH Oracle Wrapper deployed to: ', chainlinkTribeEthOracleWrapper.address);

  const chainlinkTribeUsdCompositeOracleFactory = await ethers.getContractFactory(CompositeOracle.abi, CompositeOracle.bytecode);
  const chainlinkTribeUsdCompositeOracle = await chainlinkTribeUsdCompositeOracleFactory.deploy(
    core.address, 
    chainlinkTribeEthOracleWrapper.address,
    chainlinkEthUsdOracleWrapper.address
  );

  logging && console.log('TRIBE/USD Composite Oracle deployed to: ', chainlinkTribeUsdCompositeOracle.address);

  const tribeReserveStabilizerFactory = await ethers.getContractFactory(TribeReserveStabilizer.abi, TribeReserveStabilizer.bytecode);
  const tribeReserveStabilizer = await tribeReserveStabilizerFactory.deploy(
    core.address, 
    chainlinkTribeUsdCompositeOracle.address,
    ZERO_ADDRESS,
    USD_PER_FEI_BPS,
    collateralizationOracleWrapper.address,
    CR_THRESHOLD_BPS,
    MAX_RESERVE_STABILIZER_MINT_RATE,
    RESERVE_STABILIZER_MINT_RATE,
    TRIBE_BUFFER_CAP
  );
    
  logging && console.log('TRIBE Reserve Stabilizer: ', tribeReserveStabilizer.address);
  
  // ERC20Splitter
  const tribeSplitterFactory = await ethers.getContractFactory(ERC20Splitter.abi, ERC20Splitter.bytecode);
  const tribeSplitter = await tribeSplitterFactory.deploy(
    core.address,
    tribe.address,
    [tribeReserveStabilizer.address, core.address, erc20Dripper.address],
    [SPLIT_BURN_BPS, SPLIT_DAO_BPS, SPLIT_LM_BPS]
  );
  logging && console.log('TRIBE Splitter: ', tribeSplitter.address);

  const feiTribeLBPSwapperFactory = await ethers.getContractFactory(BalancerLBPSwapper.abi, BalancerLBPSwapper.bytecode);
  const feiTribeLBPSwapper = await feiTribeLBPSwapperFactory.deploy(
    core.address, 
    {
      _oracle: chainlinkTribeUsdCompositeOracle.address,
      _backupOracle: ZERO_ADDRESS,
      _invertOraclePrice: false, // TODO check this
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    fei.address,
    tribe.address,
    tribeSplitter.address,
    MIN_LBP_SIZE
  );
  logging && console.log('FEI->TRIBE LBP Swapper: ', feiTribeLBPSwapper.address);

  const lbpFactory = await ethers.getContractAt(ILiquidityBootstrappingPoolFactory.abi, balancerLBPoolFactory.address);

  const tx: TransactionResponse = await lbpFactory.create(
    'FEI->TRIBE Auction Pool',
    'apFEI-TRIBE',
    [fei.address, tribe.address],
    [`99${e16}`, `1${e16}`],
    `30${e14}`,
    feiTribeLBPSwapper.address,
    true
  );

  const txReceipt = await tx.wait();
  const { logs: rawLogs } = txReceipt
  const feiTribeLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to: ', feiTribeLBPAddress);

  await feiTribeLBPSwapper.init(feiTribeLBPAddress);

  const pcvEquityMinterFactory = await ethers.getContractFactory(PCVEquityMinter.abi, PCVEquityMinter.bytecode);
  const pcvEquityMinter = await pcvEquityMinterFactory.deploy(
    core.address,
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
    staticPcvDepositWrapper,
  } as NamedContracts;
}

export { deploy };