const Core = artifacts.require("Core");
const Fii = artifacts.require("Fii");
const Oracle = artifacts.require("Oracle");
const EthBonding = artifacts.require("EthBondingCurve");
const PrototypeEthAllocation = artifacts.require("PrototypeEthAllocation");
const PrototypeIncentive = artifacts.require("PrototypeIncentive");

module.exports = function(deployer, network, accounts) {
  	var core, fii, oracle, bc, a1, a2, i1;
	deployer.then(function() {
	  	// Create a new version of Core
	  	return deployer.deploy(Core);
	}).then(function(instance) {
	  	core = instance;
	  	// Get the deployed instance of Fii
	  	return deployer.deploy(Fii, core.address);
	}).then(function(instance) {
	  	fii = instance;
	  	return core.setFii(fii.address);
	}).then(function(instance) {
	  	return deployer.deploy(Oracle);
	}).then(function(instance) {
	  	return deployer.deploy(PrototypeEthAllocation, accounts[1]);
	}).then(function(instance) {
	  	a1 = instance;
	  	return deployer.deploy(PrototypeEthAllocation, accounts[2]);
	}).then(function(instance) {
	  	a2 = instance;
	  	return deployer.deploy(EthBonding, "1000000000000000000", core.address, [a1.address, a2.address], [9000, 1000]);
	}).then(function(instance) {
	 	bc = instance;
	 	return core.grantMinter(bc.address);
	}).then(function(instance) {
	 	return deployer.deploy(PrototypeIncentive, 10000, true);
	}).then(function(instance) {
		i1 = instance;
		fii.addIncentiveContract(accounts[3], i1.address);
	});
}