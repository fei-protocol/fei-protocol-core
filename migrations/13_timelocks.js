const CoreOrchestrator = artifacts.require("CoreOrchestrator");
const TimelockedDelegator = artifacts.require("TimelockedDelegator");

module.exports = function(deployer, network, accounts) {
  	var coreOrchestrator, tribe, beneficiary, duration;

    var timelockedDelegators = [];

	deployer.then(function() {
	  	return CoreOrchestrator.deployed();
	}).then(function(instance) {
		coreOrchestrator = instance;
	  	return coreOrchestrator.tribe();
	}).then(function(instance) {
	  	tribe = instance;
	  	return coreOrchestrator.admin();
	}).then(function(instance) {
		beneficiary = instance
	  	return coreOrchestrator.TOKEN_TIMELOCK_RELEASE_WINDOW();
	}).then(function(instance) {
	  	duration = instance;
	  	return coreOrchestrator.timelockedDelegator(); //deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
    }).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return deployer.deploy(TimelockedDelegator, tribe, beneficiary, duration);
	}).then(function(instance) {
		timelockedDelegators.push(instance.address);
        return coreOrchestrator.initTimelocks(timelockedDelegators);
	});
}