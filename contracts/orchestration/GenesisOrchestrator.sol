pragma solidity ^0.6.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "../pool/FeiPool.sol";
import "../genesis/GenesisGroup.sol";

contract GenesisOrchestrator is Ownable {

	function init(
		address core, 
		address ethBondingCurve, 
		address ido, 
		address tribeFeiPair,
		uint32 genesisDuration,
		uint maxPriceBPs,
		uint exhangeRateDiscount,
		uint32 poolDuration
	) public onlyOwner returns (address genesisGroup, address pool) {
		genesisGroup = address(new GenesisGroup(
			core, 
			ethBondingCurve, 
			ido, 
			genesisDuration, 
			maxPriceBPs, 
			exhangeRateDiscount,
			msg.sender
		));
		pool = address(new FeiPool(core, tribeFeiPair, poolDuration));
		return (genesisGroup, pool);
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}