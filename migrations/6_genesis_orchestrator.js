const GenesisOrchestrator = artifacts.require("GenesisOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(GenesisOrchestrator);
}