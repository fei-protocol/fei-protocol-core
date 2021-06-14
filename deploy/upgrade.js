const { BN, ether } = require('@openzeppelin/test-helpers');
const { web3 } = require('hardhat');

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

const chainlinkEthUsdOracle = '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419';
const chainlinkFeiEthOracle = '0x7F0D2c2838c6AC24443d13e23d99490017bDe370';

// Upgrade the Fei system to v1.1, as according to the OpenZeppelin audit done in June 2021
// Key changes include: Adding ERC20 support, updated reweight algorithm, Chainlink support, and a TRIBE backstop
async function main() {
  if (!coreAddress || !feiEthPairAddress || !wethAddress || !uniswapRouterAddress || !uniswapOracleAddress) {
    throw new Error('An environment variable contract address is not set');
  }
    
  const deployAddress = (await web3.eth.getAccounts())[0];

  const uniswapPCVDeposit = await UniswapPCVDeposit.new(
    coreAddress,
    feiEthPairAddress,
    uniswapRouterAddress, 
    uniswapOracleAddress,
    '100',
    { from: deployAddress }
  );
  console.log('UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address);

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
  console.log('Uniswap PCV controller deployed to: ', uniswapPCVController.address);
    
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
  console.log('Bonding curve deployed to: ', bondingCurve.address);

  const chainlinkEthUsdOracleWrapper = await ChainlinkOracleWrapper.new(
    coreAddress, 
    chainlinkEthUsdOracle
  );
  
  console.log('Chainlink ETH-USD oracle: ', chainlinkEthUsdOracleWrapper.address);
  
  const chainlinkFeiEthOracleWrapper = await ChainlinkOracleWrapper.new(
    coreAddress, 
    chainlinkFeiEthOracle
  );
  
  console.log('Chainlink FEI-ETH oracle: ', chainlinkFeiEthOracleWrapper.address);

  const compositeOracle = await CompositeOracle.new(
    coreAddress, 
    chainlinkEthUsdOracleWrapper.address, 
    chainlinkFeiEthOracleWrapper.address
  );
  console.log('Composite FEI-USD oracle: ', compositeOracle.address);

  const tribeReserveStabilizer = await TribeReserveStabilizer.new(
    coreAddress, 
    uniswapOracleAddress,
    9900, // $.99 redemption - 1% fee
    compositeOracle.address,
    9700 // $.97 FEI threshold
  );

  console.log('TRIBE Reserve Stabilizer: ', tribeReserveStabilizer.address);

  const ethReserveStabilizer = await EthReserveStabilizer.new(
    coreAddress,
    uniswapOracleAddress,
    9900, // $.99 redemption - 1% fee
    wethAddress
  );

  console.log('ETH Reserve Stabilizer: ', ethReserveStabilizer.address);

  const pcvDripController = await PCVDripController.new(
    coreAddress,
    uniswapPCVDeposit.address,
    ethReserveStabilizer.address,
    3600, // hourly
    tenPow18.mul(new BN('5000')), // 5000 ETH drip
    tenPow18.mul(new BN('100')) // 100 FEI incentive
  );

  console.log('PCV Drip controller', pcvDripController.address);

  const ratioPCVController = await RatioPCVController.new(
    coreAddress
  );

  console.log('Ratio PCV controller', ratioPCVController.address);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.log(err);
    process.exit(1);
  });
