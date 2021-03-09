const PCVDepositOrchestrator = artifacts.require("PCVDepositOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(PCVDepositOrchestrator);
}