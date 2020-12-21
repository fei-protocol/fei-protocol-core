pragma solidity ^0.6.0;

import "../dao/GovernorAlpha.sol";
import "../dao/Timelock.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GovernanceOrchestrator is Ownable {

	uint public timelockDelay = 3 days;

	function init(address admin, address tribe) public onlyOwner returns (
		address governorAlpha, address timelock
	) {
		timelock = address(new Timelock(admin, timelockDelay));
		governorAlpha = address(new GovernorAlpha(address(timelock), tribe, admin));
		return (governorAlpha, timelock);
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}