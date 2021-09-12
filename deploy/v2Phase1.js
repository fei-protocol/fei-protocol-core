const { BN, ether } = require('@openzeppelin/test-helpers');
const { constants: { ZERO_ADDRESS } } = require('@openzeppelin/test-helpers');

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

// TODO add balancer

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiEthPairAddress,
    sushiswapDpiFeiAddress,
    wethAddress,
    uniswapRouterAddress,
    sushiswapRouterAddress,
    chainlinkEthUsdOracleWrapperAddress,
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
    rariPool24FeiPCVDepositAddress,
    rariPool25FeiPCVDepositAddress,
    rariPool26FeiPCVDepositAddress,
    rariPool27FeiPCVDepositAddress,
    poolPartyFeiPCVDepositAddress,
    indexCoopFusePoolFeiAddress,
    indexCoopFusePoolDpiPCVDepositAddress,
    reflexerStableAssetFusePoolRaiAddress,
    creamFeiPCVDepositAddress,
    compoundDaiPCVDepositAddress,
    aaveRaiPCVDeposit,
    ethLidoPCVDepositAddress
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

  const tenPow18 = ether('1');
  // TODO check inputs  
  const bondingCurve = await EthBondingCurve.new(      
    coreAddress,
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    {
      scale: tenPow18.mul(new BN('10000000')).toString(), 
      buffer: '100', 
      discount: '100', 
      pcvDeposits: [aaveEthPCVDepositAddress, compoundEthPCVDepositAddress], 
      ratios: [5000, 5000], 
      duration: '86400', 
      incentive: tenPow18.mul(new BN('100')).toString()
    },
    { from: deployAddress }
  );
  logging && console.log('Bonding curve deployed to: ', bondingCurve.address);
  
  const ratioPCVController = await RatioPCVController.new(
    coreAddress
  );
  
  logging && console.log('Ratio PCV controller', ratioPCVController.address);

  // ----------- PCV Deposit Wrapper Contracts ---------------

  
  // ----------- Collateralization Contracts ---------------

  const collateralizationOracle = await CollateralizationOracle.new(

  );

  logging && console.log('Collateralization Oracle: ', collateralizationOracle.address);

  // ----------- New Contracts ---------------

  const tribeReserveStabilizer = await TribeReserveStabilizer.new(
    coreAddress, 
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    9900, // $.99 redemption - 1% fee
    compositeOracleAddress,
    9700 // $.97 FEI threshold
  );
    
  logging && console.log('TRIBE Reserve Stabilizer: ', tribeReserveStabilizer.address);
  
  const lbpSwapper = undefined; // await LBPSwapper();

  const pcvEquityMinter = await PCVEquityMinter.new();

  const tribeSplitter = await ERC20Splitter.new();
  logging && console.log('TRIBE Splitter: ', tribeSplitter.address);

  return {
    uniswapPCVDeposit,
    bondingCurve,
    ratioPCVController,
    tribeReserveStabilizer
  };
}

module.exports = { deploy };
