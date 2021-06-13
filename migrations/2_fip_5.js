const EthUniswapPCVDeposit = artifacts.require('EthUniswapPCVDeposit');
const EthPCVDepositAdapter = artifacts.require('EthPCVDepositAdapter');
const RatioPCVController = artifacts.require('RatioPCVController');
require('dotenv').config();

module.exports = function(deployer) {   
  const coreAddress = process.env.MAINNET_CORE;
  const pair = process.env.MAINNET_FEI_ETH_PAIR;
  const router = process.env.MAINNET_UNISWAP_ROUTER;
  const oracle = process.env.MAINNET_UNISWAP_ORACLE;
  const dripperAddress = process.env.MAINNET_ETH_PCV_DRIPPER;

  deployer.then(function() {
    return deployer.deploy(EthUniswapPCVDeposit, coreAddress, pair, router, oracle);
  }).then(function(instance) {
    return deployer.deploy(EthPCVDepositAdapter, instance.address);
  }).then(function() {
    return deployer.deploy(EthPCVDepositAdapter, dripperAddress);
  }).then(function() {
    return deployer.deploy(RatioPCVController, coreAddress);
  });
};
