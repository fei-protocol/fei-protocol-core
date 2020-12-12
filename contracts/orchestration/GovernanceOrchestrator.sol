pragma solidity ^0.6.0;

import "../dao/GovernorAlpha.sol";
import "../dao/Timelock.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceOrchestrator is Ownable {
	GovernorAlpha public governorAlpha;
	uint public timelockDelay = 7 days;
	Timelock public timelock;
	bool public governanceDeployed;
	function init(address admin, address tribe) public onlyOwner {
		if(!governanceDeployed) {
			timelock = new Timelock(admin, timelockDelay);
			governorAlpha = new GovernorAlpha(address(timelock), tribe, admin);
			governanceDeployed = true;		
		}
	}
}