const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const BondingCurveOrchestrator = artifacts.require("BondingCurveOrchestrator");
const IncentiveOrchestrator = artifacts.require("IncentiveOrchestrator");
const ControllerOrchestrator = artifacts.require("ControllerOrchestrator");
const IDOOrchestrator = artifacts.require("IDOOrchestrator");
const GenesisOrchestrator = artifacts.require("GenesisOrchestrator");
const GovernanceOrchestrator = artifacts.require("GovernanceOrchestrator");
const PCVDepositOrchestrator = artifacts.require("PCVDepositOrchestrator");
const RouterOrchestrator = artifacts.require("RouterOrchestrator");
const FeiRouter = artifacts.require("FeiRouter");

module.exports = function(deployer, network, accounts) {
  	var pcvo, bc, incentive, controller, ido, genesis, gov, core, routerOrchestrator;

	deployer.then(function() {
	  	return {address: "0x498399bc72c19037905f19E7c753926Ce2e491Dc"}; //deployer.deploy(ControllerOrchestrator);
	}).then(function(instance) {
		controller = instance;
	  	return {address: "0xaEb0Cb0d0fB848f591ea4055363b7747236531a4"}; //deployer.deploy(BondingCurveOrchestrator);
	}).then(function(instance) {
	  	bc = instance;
	  	return {address: "0x32a25285cae5D7292220AE1b32feF38AE1E4f2D2"}; //deployer.deploy(GenesisOrchestrator);
	}).then(function(instance) {
		genesis = instance
	  	return {address: "0xe8634973eeE28f3b89BB04c34C63D3f490F56f6C"}; //deployer.deploy(GovernanceOrchestrator);
	}).then(function(instance) {
	  	gov = instance;
	  	return {address: "0x6e45cD812e9800E71e00cEC55456BC0597F7449e"}; //deployer.deploy(IDOOrchestrator);
	}).then(function(instance) {
		ido = instance;
	 	return {address: "0x8c62eB279Ea9C54625bC07f66398A8dBb69dbef0"}; //deployer.deploy(IncentiveOrchestrator);
	}).then(function(instance) {
		incentive = instance;
	 	return {address: "0x63cD56C69b20AEebD96Cd7C712475d6040F6E6Cc"}; //deployer.deploy(RouterOrchestrator);
	}).then(function(instance) {
		routerOrchestrator = instance;
	 	return {address: "0x27509b764B84A2C38775CD167F7BF38B6BABE660"}; //deployer.deploy(PCVDepositOrchestrator);
	}).then(function(instance) {
		pcvo = instance;
	 	return deployer.deploy(CoreOrchestrator,
	 		pcvo.address, 
	 		bc.address, 
	 		incentive.address, 
	 		controller.address, 
	 		ido.address, 
	 		genesis.address, 
	 		gov.address,
	 		routerOrchestrator.address, 
	 		"0x719dD5806A8d53747C0dcC26ACB7F245341EE579",
	 		{gas: 8000000}
	 	);
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
	 	return controller.transferOwnership(core.address);
	}).then(function(instance) {
	 	return pcvo.transferOwnership(core.address);
	}).then(function(instance) {
	 	return routerOrchestrator.transferOwnership(core.address);
	}).then(function(instance) {
	 	return core.initPairs();
	}).then(function(instance) {
	 	return core.initPCVDeposit();
	}).then(function(instance) {
	 	return core.initBondingCurve();
	}).then(function(instance) {
	 	return core.initIncentive();
	}).then(function(instance) {
	 	return core.initController();
	}).then(function(instance) {
	 	return core.initIDO();
	}).then(function(instance) {
	 	return core.initGenesis();
	}).then(function(instance) {
	 	return core.initGovernance();
	}).then(function(instance) {
	 	return core.initRouter();
	});
}