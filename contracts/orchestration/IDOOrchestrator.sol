pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../genesis/IDO.sol";
import "../dao/TimelockedDelegator.sol";

contract IDOOrchestrator is Ownable {

	function init(
		address core, 
		address admin, 
		address tribe, 
		address pair, 
		address router,
		uint32 releaseWindow
	) public onlyOwner returns (
		address ido,
		address timelockedDelegator
	) {
		ido = address(new IDO(core, admin, releaseWindow, pair, router));
		timelockedDelegator = address(new TimelockedDelegator(tribe, admin, releaseWindow));
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}