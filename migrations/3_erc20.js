const { BN, ether } = require('@openzeppelin/test-helpers');


const UniswapPCVDeposit = artifacts.require("UniswapPCVDeposit");
const UniswapPCVController = artifacts.require("UniswapPCVController");
const BondingCurve = artifacts.require("BondingCurve");

module.exports = function(deployer) { 
    require('dotenv').config();
    const coreAddress = process.env.MAINNET_CORE;
    const pair = process.env.MAINNET_FEI_ETH_PAIR;
    const weth = process.env.MAINNET_WETH;
    const router = process.env.MAINNET_UNISWAP_ROUTER;
    const oracle = process.env.MAINNET_UNISWAP_ORACLE;

    var pcvDeposit;

    let tenPow18 = ether('1');

    deployer.then(function() {
        return deployer.deploy(UniswapPCVDeposit, coreAddress, pair, router, oracle, '100');
    }).then(function(instance) {
        pcvDeposit = instance;
        return deployer.deploy(UniswapPCVController, coreAddress, instance.address, oracle, tenPow18.mul(new BN('500')), new BN('100'), pair, 14400);
    }).then(function() {
        return deployer.deploy(BondingCurve, tenPow18.mul(new BN('10000000')), coreAddress, [pcvDeposit.address], [10000], oracle, '100', tenPow18.mul(new BN('500')));
    }).then(function(instance) {
        return instance.setToken(weth);
    });
}