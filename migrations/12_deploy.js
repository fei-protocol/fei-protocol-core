const CoreOrchestrator = artifacts.require("CoreOrchestrator");

module.exports = function(deployer) {
	deployer.then(function() {
	 	return CoreOrchestrator.deployed();
	}).then(function(instance) {
		coreOrchestrator = instance;
	 	return coreOrchestrator.initCore();
	}).then(function() {
	 	return coreOrchestrator.initPairs();
	}).then(function() {
	 	return coreOrchestrator.initPCVDeposit();
	}).then(function() {
	 	return coreOrchestrator.initBondingCurve();
	}).then(function() {
	 	return coreOrchestrator.initIncentive();
	}).then(function() {
	 	return coreOrchestrator.initController();
	}).then(function() {
		 return coreOrchestrator.initIDO();
	}).then(function() {
	 	return coreOrchestrator.initGovernance();
	}).then(function() {
	 	return coreOrchestrator.initRouter();
	}).then(function() {
		return coreOrchestrator.initGenesis();
	}).then(function() {
		return coreOrchestrator.initStaking();
    });
}