pragma solidity ^0.6.0;

import "../genesis/GenesisGroup.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenesisOrchestrator is Ownable {
	GenesisGroup public genesisGroup;
	bool public deployed;
	function init(address core, address ethBondingCurve, address ido) public onlyOwner {
		if(!deployed) {
			genesisGroup = new GenesisGroup(core, ethBondingCurve, ido);
			deployed = true;		
		}
	}
}