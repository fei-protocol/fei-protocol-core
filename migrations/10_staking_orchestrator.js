const StakingOrchestrator = artifacts.require("StakingOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(StakingOrchestrator);
}