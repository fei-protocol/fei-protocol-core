const { BN, ether } = require('@openzeppelin/test-helpers');
const { constants: { ZERO_ADDRESS } } = require('@openzeppelin/test-helpers');
const { web3 } = require('hardhat');

const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const EthBondingCurve = artifacts.require('EthBondingCurve');
const TribeReserveStabilizer = artifacts.require('TribeReserveStabilizer');
const RatioPCVController = artifacts.require('RatioPCVController');
const CollateralizationOracleKeeper = artifacts.require('CollateralizationOracleKeeper');
const CollateralizationOracle = artifacts.require('CollateralizationOracle');
const CollateralizationOracleWrapper = artifacts.require('CollateralizationOracleWrapper');
const TransparentUpgradeableProxy = artifacts.require('TransparentUpgradeableProxy');
const PCVEquityMinter = artifacts.require('PCVEquityMinter');
const ERC20Splitter = artifacts.require('ERC20Splitter');
const PCVDepositWrapper = artifacts.require('PCVDepositWrapper');
const BalancerLBPSwapper = artifacts.require('BalancerLBPSwapper');
const ChainlinkOracleWrapper = artifacts.require('ChainlinkOracleWrapper');
const CompositeOracle = artifacts.require('CompositeOracle');
const ILiquidityBootstrappingPoolFactory = artifacts.require('ILiquidityBootstrappingPoolFactory');

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
const MIN_LBP_SIZE = `1000000${e18}`; // 1M FEI
const LBP_SLIPPAGE_BPS = '100'; // 1%

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

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiAddress,
    tribeAddress,
    feiEthPairAddress,
    sushiswapDpiFeiAddress,
    wethAddress,
    uniswapRouterAddress,
    sushiswapRouterAddress,
    chainlinkEthUsdOracleWrapperAddress,
    chainlinkRaiUsdCompositOracleAddress,
    chainlinkDaiUsdOracleWrapperAddress,
    compositeOracleAddress,
    aaveEthPCVDepositAddress,
    compoundEthPCVDepositAddress,
    chainlinkDpiUsdOracleWrapperAddress,
    daiBondingCurveAddress,
    dpiBondingCurveAddress,
    raiBondingCurveAddress,
    ethReserveStabilizerAddress,
    rariPool8FeiPCVDepositAddress,
    rariPool7FeiPCVDepositAddress,
    rariPool6FeiPCVDepositAddress,
    rariPool9FeiPCVDepositAddress,
    rariPool19DpiPCVDepositAddress,
    rariPool19FeiPCVDepositAddress,
    rariPool24FeiPCVDepositAddress,
    rariPool25FeiPCVDepositAddress,
    rariPool26FeiPCVDepositAddress,
    rariPool27FeiPCVDepositAddress,
    poolPartyFeiPCVDepositAddress,
    rariPool9RaiPCVDepositAddress,
    creamFeiPCVDepositAddress,
    compoundDaiPCVDepositAddress,
    aaveRaiPCVDepositAddress,
    ethLidoPCVDepositAddress,
    daiAddress,
    dpiAddress,
    raiAddress,
    proxyAdminAddress,
    chainlinkTribeEthOracleAddress,
    erc20DripperAddress,
    balancerLBPoolFactoryAddress
  } = addresses;

  if (
    !coreAddress || !feiEthPairAddress || !wethAddress || !uniswapRouterAddress || !chainlinkEthUsdOracleWrapperAddress || !compositeOracleAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  // ----------- Replacement Contracts ---------------
  const uniswapPCVDeposit = await UniswapPCVDeposit.new(
    coreAddress,
    feiEthPairAddress,
    uniswapRouterAddress, 
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    '100',
    { from: deployAddress }
  );
  logging && console.log('ETH UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address);
  
  const dpiUniswapPCVDeposit = await UniswapPCVDeposit.new(
    coreAddress,
    sushiswapDpiFeiAddress,
    sushiswapRouterAddress, 
    chainlinkDpiUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    '100',
    { from: deployAddress }
  );
  logging && console.log('DPI UniswapPCVDeposit deployed to: ', dpiUniswapPCVDeposit.address);

  const bondingCurve = await EthBondingCurve.new(      
    coreAddress,
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    {
      scale: SCALE, 
      buffer: BUFFER, 
      discount: DISCOUNT, 
      pcvDeposits: [aaveEthPCVDepositAddress, compoundEthPCVDepositAddress], 
      ratios: [5000, 5000], 
      duration: BC_DURATION, 
      incentive: BC_INCENTIVE
    },
    { from: deployAddress }
  );
  logging && console.log('Bonding curve deployed to: ', bondingCurve.address);
  
  const ratioPCVController = await RatioPCVController.new(
    coreAddress
  );
  
  logging && console.log('Ratio PCV controller', ratioPCVController.address);

  // ----------- PCV Deposit Wrapper Contracts ---------------

  const daiBondingCurveWrapper = await PCVDepositWrapper.new(
    daiBondingCurveAddress,
    daiAddress,
    false
  );

  logging && console.log('daiBondingCurveWrapper: ', daiBondingCurveWrapper.address);

  const compoundDaiPCVDepositWrapper = await PCVDepositWrapper.new(
    compoundDaiPCVDepositAddress,
    daiAddress,
    false
  );

  logging && console.log('compoundDaiPCVDepositWrapper: ', compoundDaiPCVDepositWrapper.address);

  const raiBondingCurveWrapper = await PCVDepositWrapper.new(
    raiBondingCurveAddress,
    raiAddress,
    false
  );

  logging && console.log('raiBondingCurveWrapper: ', raiBondingCurveWrapper.address);

  const aaveRaiPCVDepositWrapper = await PCVDepositWrapper.new(
    aaveRaiPCVDepositAddress,
    raiAddress,
    false
  );

  logging && console.log('aaveRaiPCVDepositAddress: ', aaveRaiPCVDepositWrapper.address);

  const rariPool9RaiPCVDepositWrapper = await PCVDepositWrapper.new(
    rariPool9RaiPCVDepositAddress,
    raiAddress,
    false
  );

  logging && console.log('rariPool9RaiPCVDepositWrapper: ', rariPool9RaiPCVDepositWrapper.address);

  const dpiBondingCurveWrapper = await PCVDepositWrapper.new(
    dpiBondingCurveAddress,
    dpiAddress,
    false
  );

  logging && console.log('dpiBondingCurveWrapper: ', dpiBondingCurveWrapper.address);

  const rariPool19DpiPCVDepositWrapper = await PCVDepositWrapper.new(
    rariPool19DpiPCVDepositAddress,
    dpiAddress,
    false
  );

  logging && console.log('rariPool19DpiPCVDepositWrapper: ', rariPool19DpiPCVDepositWrapper.address);

  const ethReserveStabilizerWrapper = await PCVDepositWrapper.new(
    ethReserveStabilizerAddress,
    wethAddress,
    false
  );

  logging && console.log('ethReserveStabilizerWrapper: ', ethReserveStabilizerWrapper.address);

  const ethLidoPCVDepositWrapper = await PCVDepositWrapper.new(
    ethLidoPCVDepositAddress,
    wethAddress,
    false
  );

  logging && console.log('ethLidoPCVDepositWrapper: ', ethLidoPCVDepositWrapper.address);
  
  const aaveEthPCVDepositWrapper = await PCVDepositWrapper.new(
    aaveEthPCVDepositAddress,
    wethAddress,
    false
  );

  logging && console.log('aaveEthPCVDepositWrapper: ', aaveEthPCVDepositWrapper.address);

  const compoundEthPCVDepositWrapper = await PCVDepositWrapper.new(
    compoundEthPCVDepositAddress,
    wethAddress,
    false
  );

  logging && console.log('compoundEthPCVDepositWrapper: ', compoundEthPCVDepositWrapper.address);

  // ----------- Collateralization Contracts ---------------

  const collateralizationOracle = await CollateralizationOracle.new(
    coreAddress,
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
      aaveEthPCVDepositWrapper.address
    ],
    [daiAddress, dpiAddress, wethAddress, raiAddress],
    [chainlinkDaiUsdOracleWrapperAddress, chainlinkDpiUsdOracleWrapperAddress, chainlinkEthUsdOracleWrapperAddress, chainlinkRaiUsdCompositOracleAddress],
  );

  logging && console.log('Collateralization Oracle: ', collateralizationOracle.address);

  const collateralizationOracleWrapperImpl = await CollateralizationOracleWrapper.new(
    coreAddress,
    1, // not used
  );

  logging && console.log('Collateralization Oracle Wrapper Impl: ', collateralizationOracleWrapperImpl.address);
  
  // This initialize calldata gets atomically executed against the impl logic 
  // upon construction of the proxy
  const calldata = await web3.eth.abi.encodeFunctionCall({
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
  }, [coreAddress, collateralizationOracle.address, CR_WRAPPER_DURATION, CR_WRAPPER_DEVIATION_BPS]);

  const proxy = await TransparentUpgradeableProxy.new(
    collateralizationOracleWrapperImpl.address,
    proxyAdminAddress,
    calldata,
  );

  const collateralizationOracleWrapper = await CollateralizationOracleWrapper.at(proxy.address);
  
  logging && console.log('Collateralization Oracle Wrapper Proxy: ', collateralizationOracleWrapper.address);

  const collateralizationOracleKeeper = await CollateralizationOracleKeeper.new(
    coreAddress,
    CR_KEEPER_INCENTIVE,
    collateralizationOracleWrapper.address
  );

  logging && console.log('Collateralization Oracle Keeper: ', collateralizationOracleKeeper.address);

  // ----------- New Contracts ---------------

  const chainlinkTribeEthOracleWrapper = await ChainlinkOracleWrapper.new(
    coreAddress, 
    chainlinkTribeEthOracleAddress,
    { from: deployAddress }
  );

  logging && console.log('TRIBE/ETH Oracle Wrapper deployed to: ', chainlinkTribeEthOracleWrapper.address);

  const chainlinkTribeUsdCompositeOracle = await CompositeOracle.new(
    coreAddress, 
    chainlinkTribeEthOracleWrapper.address,
    chainlinkEthUsdOracleWrapperAddress,
    { from: deployAddress }
  );

  logging && console.log('TRIBE/USD Composite Oracle deployed to: ', chainlinkTribeUsdCompositeOracle.address);

  const tribeReserveStabilizer = await TribeReserveStabilizer.new(
    coreAddress, 
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
  const tribeSplitter = await ERC20Splitter.new(
    coreAddress,
    tribeAddress,
    [tribeReserveStabilizer.address, coreAddress, erc20DripperAddress],
    [SPLIT_BURN_BPS, SPLIT_DAO_BPS, SPLIT_LM_BPS]
  );
  logging && console.log('TRIBE Splitter: ', tribeSplitter.address);

  const feiTribeLBPSwapper = await BalancerLBPSwapper.new(
    coreAddress, 
    {
      _oracle: chainlinkTribeUsdCompositeOracle.address,
      _backupOracle: ZERO_ADDRESS,
      _invertOraclePrice: false, // TODO check this
      _decimalsNormalizer: 0
    },
    LBP_FREQUENCY,
    feiAddress,
    tribeAddress,
    tribeSplitter.address,
    MIN_LBP_SIZE,
    LBP_SLIPPAGE_BPS
  );
  logging && console.log('FEI->TRIBE LBP Swapper: ', feiTribeLBPSwapper.address);

  const lbpFactory = await ILiquidityBootstrappingPoolFactory.at(balancerLBPoolFactoryAddress);

  const tx = await lbpFactory.create(
    'FEI->TRIBE Auction Pool',
    'apFEI-TRIBE',
    [feiAddress, tribeAddress],
    [`99${e16}`, `1${e16}`],
    `30${e14}`,
    feiTribeLBPSwapper.address,
    true
  );
  const { rawLogs } = tx.receipt;
  const feiTribeLBPAddress = `0x${rawLogs[rawLogs.length - 1].topics[1].slice(-40)}`;

  logging && console.log('LBP Pool deployed to: ', feiTribeLBPAddress);

  await feiTribeLBPSwapper.init(feiTribeLBPAddress);

  const pcvEquityMinter = await PCVEquityMinter.new(
    coreAddress,
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
  };
}

module.exports = { deploy };
