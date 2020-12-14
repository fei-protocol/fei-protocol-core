pragma solidity ^0.6.0;

import "../genesis/GenesisGroup.sol";
import "../Pool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenesisOrchestrator is Ownable {
	GenesisGroup public genesisGroup;
	Pool public pool;
	bool public deployed;
	function init(address core, address ethBondingCurve, address ido) public onlyOwner {
		if(!deployed) {
			genesisGroup = new GenesisGroup(core, ethBondingCurve, ido);
			pool = new Pool(core);
			deployed = true;		
		}
	}
}