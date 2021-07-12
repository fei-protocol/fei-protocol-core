const { BN, ether } = require('@openzeppelin/test-helpers');
const { constants: { ZERO_ADDRESS } } = require('@openzeppelin/test-helpers');

const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const EthBondingCurve = artifacts.require('EthBondingCurve');

const TribeReserveStabilizer = artifacts.require('TribeReserveStabilizer');
const EthReserveStabilizer = artifacts.require('EthReserveStabilizer');
const PCVDripController = artifacts.require('PCVDripController');
const RatioPCVController = artifacts.require('RatioPCVController');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiEthPairAddress,
    wethAddress,
    uniswapRouterAddress,
    chainlinkEthUsdOracleWrapperAddress,
    compositeOracleAddress
  } = addresses;

  if (
    !coreAddress || !feiEthPairAddress || !wethAddress || !uniswapRouterAddress || !chainlinkEthUsdOracleWrapperAddress || !compositeOracleAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  const uniswapPCVDeposit = await UniswapPCVDeposit.new(
    coreAddress,
    feiEthPairAddress,
    uniswapRouterAddress, 
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    '100',
    { from: deployAddress }
  );
  logging ? console.log('UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address) : undefined;
  
  const tenPow18 = ether('1');
  const uniswapPCVController = await UniswapPCVController.new(
    coreAddress,
    uniswapPCVDeposit.address,
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    tenPow18.mul(new BN('500')),
    new BN('100'),
    feiEthPairAddress,
    14400,
    { from: deployAddress }
  );
  logging ? console.log('Uniswap PCV controller deployed to: ', uniswapPCVController.address) : undefined;
    
  const bondingCurve = await EthBondingCurve.new(      
    coreAddress,
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
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
  
  const tribeReserveStabilizer = await TribeReserveStabilizer.new(
    coreAddress, 
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    9900, // $.99 redemption - 1% fee
    compositeOracleAddress,
    9700 // $.97 FEI threshold
  );
  
  logging ? console.log('TRIBE Reserve Stabilizer: ', tribeReserveStabilizer.address) : undefined;
  
  const ethReserveStabilizer = await EthReserveStabilizer.new(
    coreAddress,
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
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
    ethReserveStabilizer,
    pcvDripController,
    ratioPCVController,
    tribeReserveStabilizer
  };
}

module.exports = { deploy };
