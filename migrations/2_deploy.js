const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const BondingCurveOrchestrator = artifacts.require("BondingCurveOrchestrator");
const IncentiveOrchestrator = artifacts.require("IncentiveOrchestrator");
const ControllerOrchestrator = artifacts.require("ControllerOrchestrator");
const IDOOrchestrator = artifacts.require("IDOOrchestrator");
const GenesisOrchestrator = artifacts.require("GenesisOrchestrator");
const GovernanceOrchestrator = artifacts.require("GovernanceOrchestrator");
const PCVDepositOrchestrator = artifacts.require("PCVDepositOrchestrator");
const FeiRouter = artifacts.require("FeiRouter");

module.exports = function(deployer, network, accounts) {
  	var pcvo, bc, incentive, controller, ido, genesis, gov, core, ethPair, ui, weth;

	deployer.then(function() {
	  	return deployer.deploy(ControllerOrchestrator);
	}).then(function(instance) {
		controller = instance;
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
	 	return deployer.deploy(PCVDepositOrchestrator);
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
	 		accounts[0]
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
	 	return core.ethFeiPair();
	}).then(function(instance) {
		ethPair = instance;
	 	return core.WETH();
	}).then(function(instance) {
		weth = instance;
	 	return core.uniswapIncentive();
	}).then(function(instance) {
		ui = instance;
	 	return deployer.deploy(FeiRouter, ethPair, weth, ui);
	});
}