pragma solidity ^0.6.0;

import "../genesis/GenesisGroup.sol";
import "../pool/FeiPool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenesisOrchestrator is Ownable {

	uint public constant GENESIS_DURATION = 4 weeks;
	// uint public constant GENESIS_DURATION = 40; // TEST MODE
	uint public constant MAX_PRICE_BPS = 9000;
	uint public constant EXCHANGE_RATE_DISCOUNT = 10;
	uint32 public constant POOL_DURATION = 2 * 365 days;

	function init(
		address core, 
		address ethBondingCurve, 
		address ido
	) public onlyOwner returns (address genesisGroup, address pool) {
		genesisGroup = address(new GenesisGroup(
			core, 
			ethBondingCurve, 
			ido, 
			GENESIS_DURATION, 
			MAX_PRICE_BPS, 
			EXCHANGE_RATE_DISCOUNT,
			msg.sender
		));
		pool = address(new FeiPool(core, POOL_DURATION));
		return (genesisGroup, pool);
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}