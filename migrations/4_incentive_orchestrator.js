const IncentiveOrchestrator = artifacts.require("IncentiveOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(IncentiveOrchestrator);
}