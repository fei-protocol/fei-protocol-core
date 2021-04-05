require('dotenv').config();

const EthReserveStabilizer = artifacts.require("EthReserveStabilizer");
const core = process.env.MAINNET_CORE;
const oracle = process.env.MAINNET_UNISWAP_ORACLE

module.exports = function(deployer) {
    return deployer.deploy(EthReserveStabilizer, core, oracle, 10000);
}