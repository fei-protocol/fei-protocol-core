const Core = artifacts.require("Core");
const Fei = artifacts.require("Fei");
const Oracle = artifacts.require("Oracle");
const EthBonding = artifacts.require("EthBondingCurve");
const EthUniswapAllocation = artifacts.require("EthUniswapAllocation");
const UniswapIncentive = artifacts.require("UniswapIncentive");

module.exports = function(deployer, network, accounts) {
  	var core, allocation, oracle, bc;
	deployer.then(function() {
	  	// Create a new version of Core
	  	return deployer.deploy(Core);
	}).then(function(instance) {
	  	core = instance;
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
	});
}