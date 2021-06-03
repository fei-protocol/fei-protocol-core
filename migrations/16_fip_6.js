const ChainlinkOracleWrapper = artifacts.require("ChainlinkOracleWrapper");
const PCVSwapperUniswap = artifacts.require("PCVSwapperUniswap");
const e18 = '000000000000000000';

module.exports = function(deployer) {
    require('dotenv').config();
    const coreAddress = process.env.MAINNET_CORE;

    deployer.then(function() {
        return deployer.deploy(
          ChainlinkOracleWrapper,
          coreAddress, // core
          '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419' // Chainlink ETH/USD
        );
    }).then(function(oracle) {
      console.log('MAINNET_CHAINLINK_ORACLE_ETH=' + oracle.address);
      return deployer.deploy(
        PCVSwapperUniswap,
        coreAddress, // core
        '0xC3D03e4F041Fd4cD388c549Ee2A29a9E5075882f', // Sushi DAI-WETH pair
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        oracle.address, // Chainlink ETH-USD wrapper oracle
        '600', // default minimum interval between swaps: 10 min
        '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // tokenSpent: WETH
        '0x6b175474e89094c44da98b954eedeac495271d0f', // tokenReceived: DAI
        '0x6ef71cA9cD708883E129559F5edBFb9d9D5C6148', // tokenReceivingAddress
        '40'+e18, // maxSpentPerSwap 40 ETH
        '100', // maximumSlippageBasisPoints = 1%
        false, // invertOraclePrice
        '50'+e18 // incentive
      );
    }).then(function(swapper) {
      console.log('MAINNET_SWAPPER_ETH_DAI=' + swapper.address);
    });
}
