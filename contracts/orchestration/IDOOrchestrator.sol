pragma solidity ^0.6.0;

import "../genesis/IDO.sol";
import "../dao/TimelockedDelegator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IDOOrchestrator is Ownable {
	IDO public ido;
	TimelockedDelegator public timelockedDelegator;
	uint constant public RELEASE_WINDOW = 4 * 365 * 24 * 60 * 60; // 4 years vesting

	bool public deployed;

	function init(address core, address admin, address tribe, address pair, address router) public onlyOwner {
		if(!deployed) {
			ido = new IDO(core, admin, RELEASE_WINDOW, pair, router);
			timelockedDelegator = new TimelockedDelegator(tribe, admin, RELEASE_WINDOW);
			deployed = true;
		}
	}
}