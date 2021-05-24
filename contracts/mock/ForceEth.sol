// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;

contract ForceEth {

	constructor() public payable {

	}
	
	receive() external payable {

	}

	function forceEth(address to) public {
		selfdestruct(payable(to));
	}
}

