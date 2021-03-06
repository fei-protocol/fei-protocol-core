const BondingCurveOrchestrator = artifacts.require("BondingCurveOrchestrator");

module.exports = function(deployer) {
    return deployer.deploy(BondingCurveOrchestrator);
}