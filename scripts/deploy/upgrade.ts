import hre, { ethers, artifacts } from 'hardhat';
import { BN, ether } from '@openzeppelin/test-helpers';

const UniswapPCVDeposit = artifacts.readArtifactSync('UniswapPCVDeposit');
const UniswapPCVController = artifacts.readArtifactSync('UniswapPCVController');
const EthBondingCurve = artifacts.readArtifactSync('EthBondingCurve');
const TribeReserveStabilizer = artifacts.readArtifactSync('TribeReserveStabilizer');
const PCVDripController = artifacts.readArtifactSync('PCVDripController');
const RatioPCVController = artifacts.readArtifactSync('RatioPCVController');

async function deploy(deployAddress, addresses, logging = false) {
  const {
    coreAddress,
    feiEthPairAddress,
    wethAddress,
    uniswapRouterAddress,
    chainlinkEthUsdOracleWrapperAddress,
    compositeOracleAddress,
    aaveEthPCVDepositAddress,
    compoundEthPCVDepositAddress,
    ethReserveStabilizerAddress
  } = addresses;

  if (
    !coreAddress || !feiEthPairAddress || !wethAddress || !uniswapRouterAddress || !chainlinkEthUsdOracleWrapperAddress || !compositeOracleAddress
  ) {
    throw new Error('An environment variable contract address is not set');
  }

  await hre.network.provider.request({ method: 'hardhat_impersonateAccount', params: [deployAddress] });
  const deploySigner = await ethers.getSigner(deployAddress);

  const uniswapPCVDeposit = await (await ethers.getContractFactory('UniswapPCVDeposit', deploySigner)).deploy(
    coreAddress,
    feiEthPairAddress,
    uniswapRouterAddress, 
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    '100'
  );

  logging ? console.log('UniswapPCVDeposit deployed to: ', uniswapPCVDeposit.address) : undefined;
  
  const tenPow18 = ether('1');

  const uniswapPCVController = await (await ethers.getContractFactory('UniswapPCVController', deploySigner)).deploy(
    coreAddress,
    uniswapPCVDeposit.address,
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    tenPow18.mul(new BN('500')),
    new BN('100'),
    feiEthPairAddress,
    14400
  );

  logging ? console.log('Uniswap PCV controller deployed to: ', uniswapPCVController.address) : undefined;
    
  const bondingCurve = await (await ethers.getContractFactory('EthBondingCurve', deploySigner)).deploy(      
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
    }
  );

  logging ? console.log('Bonding curve deployed to: ', bondingCurve.address) : undefined;
  
  const tribeReserveStabilizer = await (await ethers.getContractFactory('TribeReserveStabilizer')).deploy(
    coreAddress, 
    chainlinkEthUsdOracleWrapperAddress,
    ZERO_ADDRESS,
    9900, // $.99 redemption - 1% fee
    compositeOracleAddress,
    9700 // $.97 FEI threshold
  );
  
  logging ? console.log('TRIBE Reserve Stabilizer: ', tribeReserveStabilizer.address) : undefined;
   
  const ratioPCVController = await (await ethers.getContractFactory('RatioPCVController')).deploy(
    coreAddress
  );
  
  logging ? console.log('Ratio PCV controller', ratioPCVController.address) : undefined;

  return {
    uniswapPCVDeposit,
    uniswapPCVController,
    bondingCurve,
    ratioPCVController,
    tribeReserveStabilizer
  };
}

module.exports = { deploy };
