const ControllerOrchestrator = artifacts.require("ControllerOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(ControllerOrchestrator);
}