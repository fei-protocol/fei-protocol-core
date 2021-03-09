const GovernanceOrchestrator = artifacts.require("GovernanceOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(GovernanceOrchestrator);
}