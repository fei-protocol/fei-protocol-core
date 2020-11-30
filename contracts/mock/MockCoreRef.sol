pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../refs/CoreRef.sol";

contract MockCoreRef is CoreRef {
	constructor(address core) 
		CoreRef(core)
	public {}

	function testMinter() public view onlyMinter {}

	function testBurner() public view onlyBurner {}

	function testReclaimer() public view onlyReclaimer {}

	function testGovernor() public view onlyGovernor {}
}

