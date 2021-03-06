const RouterOrchestrator = artifacts.require("RouterOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(RouterOrchestrator);
}