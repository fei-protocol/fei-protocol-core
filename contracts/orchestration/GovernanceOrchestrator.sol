pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../dao/Timelock.sol";
import "../dao/GovernorAlpha.sol";

contract GovernanceOrchestrator is Ownable {

	function init(address admin, address tribe, uint timelockDelay) public onlyOwner returns (
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