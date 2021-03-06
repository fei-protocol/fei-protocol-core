const IDOOrchestrator = artifacts.require("IDOOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(IDOOrchestrator);
}