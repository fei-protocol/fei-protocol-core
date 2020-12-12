pragma solidity ^0.6.0;

import "../genesis/IDO.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract IDOOrchestrator is Ownable {
	IDO public ido;
	bool public deployed;

	function init(address core, address admin) public onlyOwner {
		ido = new IDO(core, admin);
	}
}