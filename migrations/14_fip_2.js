const EthReserveStabilizer = artifacts.require("EthReserveStabilizer");
const EthPCVDripper = artifacts.require("EthPCVDripper");

module.exports = function(deployer) { 
    require('dotenv').config();
    const core = process.env.MAINNET_CORE;
    const oracle = process.env.MAINNET_UNISWAP_ORACLE;
    deployer.then(function() {
        return deployer.deploy(EthReserveStabilizer, core, oracle, "9500");
    }).then(function(instance) {
       return deployer.deploy(EthPCVDripper, core, instance.address, "60", "5000000000000000000"); // 5 ETH per minute
    })
}