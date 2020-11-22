const Core = artifacts.require("Core");
const Fii = artifacts.require("Fii");
const Oracle = artifacts.require("Oracle");
const EthBonding = artifacts.require("EthBondingCurve");
const EthUniswapAllocation = artifacts.require("EthUniswapAllocation");
const PrototypeIncentive = artifacts.require("PrototypeIncentive");

module.exports = function(deployer, network, accounts) {
  	var core, fii, oracle, bc, allocation, i1;
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
		oracle = instance
	  	return deployer.deploy(EthUniswapAllocation, core.address);
	}).then(function(instance) {
	  	allocation = instance;
	  	return deployer.deploy(EthBonding, "1000000000000000000", core.address, [allocation.address], [10000], oracle.address);
	}).then(function(instance) {
		bc = instance;
	 	return core.grantMinter(allocation.address);
	}).then(function(instance) {
	 	return allocation.addLiquidity("1000000000000000000", {value: "1000000000000000000"});
	}).then(function(instance) {
	 	return core.grantMinter(bc.address);
	}).then(function(instance) {
	 	return deployer.deploy(PrototypeIncentive, 10000, true);
	}).then(function(instance) {
		i1 = instance;
		fii.addIncentiveContract(accounts[3], i1.address);
	});
}