// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../refs/CoreRef.sol";

contract MockIncentivized is CoreRef {

	constructor(address core) public
		CoreRef(core)
	{}

    function sendFei(
        address to,
        uint256 amount
    ) public {
        fei().transfer(to, amount);
    }

    function approve(address account) public {
        fei().approve(account, uint(-1));
    }

    function sendFeiFrom(
        address from,
        address to,
        uint256 amount
    ) public {
        fei().transferFrom(from, to, amount);
    }
}