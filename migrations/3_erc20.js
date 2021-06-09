/* eslint-disable newline-per-chained-call */
const { BN, ether } = require('@openzeppelin/test-helpers');

const UniswapPCVDeposit = artifacts.require('UniswapPCVDeposit');
const UniswapPCVController = artifacts.require('UniswapPCVController');
const EthBondingCurve = artifacts.require('EthBondingCurve');
const EthReserveStabilizer = artifacts.require('EthReserveStabilizer');
const TribeReserveStabilizer = artifacts.require('TribeReserveStabilizer');
const ChainlinkOracleWrapper = artifacts.require('ChainlinkOracleWrapper');
const CompositeOracle = artifacts.require('CompositeOracle');

module.exports = function(deployer) { 
  // eslint-disable-next-line global-require
  require('dotenv').config();
  const coreAddress = process.env.MAINNET_CORE;
  const pair = process.env.MAINNET_FEI_ETH_PAIR;
  const weth = process.env.MAINNET_WETH;
  const router = process.env.MAINNET_UNISWAP_ROUTER;
  const oracle = process.env.MAINNET_UNISWAP_ORACLE;

  let pcvDeposit; let ethUsdChainlinkOracle; let feiEthChainlinkOracle;

  const tenPow18 = ether('1');

  deployer.then(function() {
    return deployer.deploy(UniswapPCVDeposit, coreAddress, pair, router, oracle, '100');
  }).then(function(instance) {
    pcvDeposit = instance;
    return deployer.deploy(UniswapPCVController, coreAddress, instance.address, oracle, tenPow18.mul(new BN('500')), new BN('100'), pair, 14400);
  }).then(function() {
    return deployer.deploy(EthBondingCurve, coreAddress, oracle, {
      scale: tenPow18.mul(new BN('10000000')).toString(), buffer: '100', discount: '100', pcvDeposits: [pcvDeposit.address], ratios: [10000], duration: '86400', incentive: tenPow18.mul(new BN('100')).toString()
    });
  }).then(function() {
    return deployer.deploy(ChainlinkOracleWrapper, coreAddress, '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419');
  }).then(function(instance) {
    ethUsdChainlinkOracle = instance;
    return deployer.deploy(ChainlinkOracleWrapper, coreAddress, '0x7F0D2c2838c6AC24443d13e23d99490017bDe370');
  }).then(function(instance) {
    feiEthChainlinkOracle = instance;
    return deployer.deploy(CompositeOracle, coreAddress, ethUsdChainlinkOracle.address, feiEthChainlinkOracle.address);
  }).then(function(instance) {
    return deployer.deploy(TribeReserveStabilizer, coreAddress, oracle, 9900, instance.address, 9500);
  }).then(function() {
    return deployer.deploy(EthReserveStabilizer, coreAddress, oracle, 9500, weth);
  });
};
