const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const BondingCurveOrchestrator = artifacts.require("BondingCurveOrchestrator");
const GenesisOrchestrator = artifacts.require("GenesisOrchestrator");
const GovernanceOrchestrator = artifacts.require("GovernanceOrchestrator");
const IDOOrchestrator = artifacts.require("IDOOrchestrator");
const IncentiveOrchestrator = artifacts.require("IncentiveOrchestrator");

module.exports = function(deployer, network, accounts) {
  	var bc, incentive, ido, genesis, gov, core;

	deployer.then(function() {
	  	return deployer.deploy(BondingCurveOrchestrator);
	}).then(function(instance) {
	  	bc = instance;
	  	return deployer.deploy(GenesisOrchestrator);
	}).then(function(instance) {
		genesis = instance
	  	return deployer.deploy(GovernanceOrchestrator);
	}).then(function(instance) {
	  	gov = instance;
	  	return deployer.deploy(IDOOrchestrator);
	}).then(function(instance) {
		ido = instance;
	 	return deployer.deploy(IncentiveOrchestrator);
	}).then(function(instance) {
		incentive = instance;
	 	return deployer.deploy(CoreOrchestrator, bc.address, incentive.address, ido.address, genesis.address, gov.address);
	}).then(function(instance) {
		core = instance;
	 	return bc.transferOwnership(core.address);
	}).then(function(instance) {
	 	return incentive.transferOwnership(core.address);
	}).then(function(instance) {
	 	return ido.transferOwnership(core.address);
	}).then(function(instance) {
	 	return genesis.transferOwnership(core.address);
	}).then(function(instance) {
	 	return gov.transferOwnership(core.address);
	}).then(function(instance) {
	 	return core.initBondingCurve();
	}).then(function(instance) {
	 	return core.initIncentive();
	}).then(function(instance) {
	 	return core.initIDO();
	}).then(function(instance) {
	 	return core.initGenesis();
	}).then(function(instance) {
	 	return core.initGovernance();
	});
}