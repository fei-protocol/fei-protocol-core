pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../dao/Timelock.sol";
import "../dao/GovernorAlpha.sol";
import "./IOrchestrator.sol";

contract GovernanceOrchestrator is IGovernanceOrchestrator, Ownable {

	function init(address admin, address tribe, uint timelockDelay) public override onlyOwner returns (
		address governorAlpha, address timelock
	) {
		timelock = address(new Timelock(admin, timelockDelay));
		governorAlpha = address(new GovernorAlpha(address(timelock), tribe, admin));
		return (governorAlpha, timelock);
	}

	function detonate() public override onlyOwner {
		selfdestruct(payable(owner()));
	}
}