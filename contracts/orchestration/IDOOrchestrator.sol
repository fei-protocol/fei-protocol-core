pragma solidity ^0.6.0;

import "../genesis/IDO.sol";
import "../dao/TimelockedDelegator.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IDOOrchestrator is Ownable {
	IDO public ido;
	TimelockedDelegator public timelockedDelegator;
	bool public deployed;

	function init(address core, address admin, address tribe) public onlyOwner {
		if(!deployed) {
			ido = new IDO(core, admin);
			timelockedDelegator = new TimelockedDelegator(tribe, admin);
			deployed = true;
		}
	}
}