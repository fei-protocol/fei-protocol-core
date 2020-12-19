pragma solidity ^0.6.0;

import "../genesis/IDO.sol";
import "../dao/TimelockedDelegator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IDOOrchestrator is Ownable {
	IDO public ido;
	TimelockedDelegator public timelockedDelegator;
	bool public deployed;
	uint constant public RELEASE_WINDOW = 4 * 365 * 24 * 60 * 60; // 4 years vesting

	function init(address core, address admin, address tribe) public onlyOwner {
		if(!deployed) {
			ido = new IDO(core, admin, RELEASE_WINDOW);
			timelockedDelegator = new TimelockedDelegator(tribe, admin, RELEASE_WINDOW);
			deployed = true;
		}
	}
}