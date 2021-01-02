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
		address oracle,
		uint32 genesisDuration,
		uint maxPriceBPs,
		uint exhangeRateDiscount,
		uint32 poolDuration
	) public onlyOwner returns (address genesisGroup, address pool) {
		pool = address(new FeiPool(core, tribeFeiPair, poolDuration));
		genesisGroup = address(new GenesisGroup(
			core, 
			ethBondingCurve, 
			ido,
			oracle,
			pool, 
			genesisDuration, 
			maxPriceBPs, 
			exhangeRateDiscount
		));
		return (genesisGroup, pool);
	}

	function detonate() public onlyOwner {
		selfdestruct(payable(owner()));
	}
}