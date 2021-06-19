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

const { getAddresses } = require('../scripts/utils/helpers');

const {
  coreAddress,
  feiEthPairAddress,
  wethAddress,
  uniswapRouterAddress,
  uniswapOracleAddress
} = getAddresses();

async function upgrade(deployAddress, logging = false) {
  if (!coreAddress || !feiEthPairAddress || !wethAddress || !uniswapRouterAddress || !uniswapOracleAddress) {
    throw new Error('An environment variable contract address is not set');
  }

  const chainlinkEthUsdOracle = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
  const chainlinkFeiEthOracle = '0x7F0D2c2838c6AC24443d13e23d99490017bDe370';

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
  
  const chainlinkEthUsdOracleWrapper = await ChainlinkOracleWrapper.new(
    coreAddress, 
    chainlinkEthUsdOracle
  );
  
  logging ? console.log('Chainlink ETH-USD oracle: ', chainlinkEthUsdOracleWrapper.address) : undefined;
  
  const chainlinkFeiEthOracleWrapper = await ChainlinkOracleWrapper.new(
    coreAddress, 
    chainlinkFeiEthOracle
  );
  
  logging ? console.log('Chainlink FEI-ETH oracle: ', chainlinkFeiEthOracleWrapper.address) : undefined;
  
  const compositeOracle = await CompositeOracle.new(
    coreAddress, 
    chainlinkEthUsdOracleWrapper.address, 
    chainlinkFeiEthOracleWrapper.address
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
}

module.exports = { upgrade };
