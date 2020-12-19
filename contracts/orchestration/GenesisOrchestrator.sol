pragma solidity ^0.6.0;

import "../genesis/GenesisGroup.sol";
import "../Pool.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract GenesisOrchestrator is Ownable {
	GenesisGroup public genesisGroup;
	Pool public pool;
	bool public deployed;
	uint public constant GENESIS_DURATION = 4 weeks;
	uint public constant MAX_PRICE_BPS = 9000;
	uint public constant EXCHANGE_RATE_DISCOUNT = 10;
	uint32 public constant POOL_DURATION = 2 * 365 days;

	function init(address core, address ethBondingCurve, address ido) public onlyOwner {
		if(!deployed) {
			genesisGroup = new GenesisGroup(core, ethBondingCurve, ido, GENESIS_DURATION, MAX_PRICE_BPS, EXCHANGE_RATE_DISCOUNT);
			pool = new Pool(core, POOL_DURATION);
			deployed = true;		
		}
	}
}