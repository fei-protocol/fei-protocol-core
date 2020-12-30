pragma solidity ^0.6.0;

import "../genesis/IDO.sol";
import "../dao/TimelockedDelegator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IDOOrchestrator is Ownable {
	
	uint32 constant public RELEASE_WINDOW = 4 * 365 * 24 * 60 * 60; // 4 years vesting

	function init(
		address core, 
		address admin, 
		address tribe, 
		address pair, 
		address router
	) public onlyOwner returns (
		address ido,
		address timelockedDelegator
	) {
		ido = address(new IDO(core, admin, RELEASE_WINDOW, pair, router));
		timelockedDelegator = address(new TimelockedDelegator(tribe, admin, RELEASE_WINDOW));
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}