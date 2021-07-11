const { BN, ether } = require('@openzeppelin/test-helpers');

const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const EthBondingCurve = artifacts.require('EthBondingCurve');

const TribeReserveStabilizer = artifacts.require('TribeReserveStabilizer');
const EthReserveStabilizer = artifacts.require('EthReserveStabilizer');
const ChainlinkOracleWrapper = artifacts.require('ChainlinkOracleWrapper');
const CompositeOracle = artifacts.require('CompositeOracle');
const PCVDripController = artifacts.require('PCVDripController');
const RatioPCVController = artifacts.require('RatioPCVController');

async function upgrade(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiEthPairAddress,
    wethAddress,
    uniswapRouterAddress,
    uniswapOracleAddress,
    chainlinkEthUsdOracleAddress,
    chainlinkFeiEthOracleAddress
  } = addresses;

  if (
    !coreAddress || !feiEthPairAddress || !wethAddress || !uniswapRouterAddress || !uniswapOracleAddress || !chainlinkEthUsdOracleAddress || !chainlinkFeiEthOracleAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const uniswapPCVDeposit = await UniswapPCVDeposit.new(
    coreAddress,
    feiEthPairAddress,
    uniswapRouterAddress, 
    uniswapOracleAddress,
    '100',
    { from: deployAddress }
  );
  logging ? console.log('UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address) : undefined;
  
  const tenPow18 = ether('1');
  const uniswapPCVController = await UniswapPCVController.new(
    coreAddress,
    uniswapPCVDeposit.address,
    uniswapOracleAddress,
    tenPow18.mul(new BN('500')),
    new BN('100'),
    feiEthPairAddress,
    14400,
    { from: deployAddress }
  );
  logging ? console.log('Uniswap PCV controller deployed to: ', uniswapPCVController.address) : undefined;
    
  const bondingCurve = await EthBondingCurve.new(      
    coreAddress,
    uniswapOracleAddress,
    {
      scale: tenPow18.mul(new BN('10000000')).toString(), 
      buffer: '100', 
      discount: '100', 
      pcvDeposits: [uniswapPCVDeposit.address], 
      ratios: [10000], 
      duration: '86400', 
      incentive: tenPow18.mul(new BN('100')).toString()
    },
    { from: deployAddress }
  );
  logging ? console.log('Bonding curve deployed to: ', bondingCurve.address) : undefined;
  
  const chainlinkEthUsdOracle = await ChainlinkOracleWrapper.new(
    coreAddress, 
    chainlinkEthUsdOracleAddress
  );
  
  logging ? console.log('Chainlink ETH-USD oracle: ', chainlinkEthUsdOracle.address) : undefined;
  
  const chainlinkFeiEthOracle = await ChainlinkOracleWrapper.new(
    coreAddress, 
    chainlinkFeiEthOracleAddress
  );
  
  logging ? console.log('Chainlink FEI-ETH oracle: ', chainlinkFeiEthOracle.address) : undefined;
  
  const compositeOracle = await CompositeOracle.new(
    coreAddress, 
    chainlinkEthUsdOracleAddress, 
    chainlinkFeiEthOracle.address
  );
  logging ? console.log('Composite FEI-USD oracle: ', compositeOracle.address) : undefined;
  
  const tribeReserveStabilizer = await TribeReserveStabilizer.new(
    coreAddress, 
    uniswapOracleAddress,
    9900, // $.99 redemption - 1% fee
    compositeOracle.address,
    9700 // $.97 FEI threshold
  );
  
  logging ? console.log('TRIBE Reserve Stabilizer: ', tribeReserveStabilizer.address) : undefined;
  
  const ethReserveStabilizer = await EthReserveStabilizer.new(
    coreAddress,
    uniswapOracleAddress,
    9900, // $.99 redemption - 1% fee
    wethAddress
  );
  
  logging ? console.log('ETH Reserve Stabilizer: ', ethReserveStabilizer.address) : undefined;
  
  const pcvDripController = await PCVDripController.new(
    coreAddress,
    uniswapPCVDeposit.address,
    ethReserveStabilizer.address,
    3600, // hourly
    tenPow18.mul(new BN('5000')), // 5000 ETH drip
    tenPow18.mul(new BN('100')) // 100 FEI incentive
  );
  
  logging ? console.log('PCV Drip controller', pcvDripController.address) : undefined;
  
  const ratioPCVController = await RatioPCVController.new(
    coreAddress
  );
  
  logging ? console.log('Ratio PCV controller', ratioPCVController.address) : undefined;

  return {
    uniswapPCVDeposit,
    uniswapPCVController,
    bondingCurve,
    chainlinkEthUsdOracle,
    chainlinkFeiEthOracle,
    compositeOracle,
    ethReserveStabilizer,
    pcvDripController,
    ratioPCVController,
    tribeReserveStabilizer
  };
}

module.exports = { upgrade };
