const EthReserveStabilizer = artifacts.require("EthReserveStabilizer");
const EthPCVDripper = artifacts.require("EthPCVDripper");
const TribeDripper = artifacts.require("TribeDripper");

module.exports = function(deployer) { 
    require('dotenv').config();
    const core = process.env.MAINNET_CORE;
    const oracle = process.env.MAINNET_UNISWAP_ORACLE;
    const rewardsDistributor = process.env.MAINNET_FEI_REWARDS_DISTRIBUTOR;
    deployer.then(function() {
        return deployer.deploy(EthReserveStabilizer, core, oracle, "9500");
    }).then(function(instance) {
       return deployer.deploy(EthPCVDripper, core, instance.address, "3600", "5000000000000000000000"); // 5000 ETH per hour
    }).then(function() {
        return deployer.deploy(
            TribeDripper, 
            core, 
            rewardsDistributor, 
            "604800", // weekly distribution
            [
              "47000000000000000000000000", 
              "31000000000000000000000000", 
              "22000000000000000000000000"
            ]
        );
    });
}