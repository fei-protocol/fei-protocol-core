// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";

contract MockIncentivized is CoreRef {

	constructor(address core) CoreRef(core) {}

    function sendFei(
        address to,
        uint256 amount
    ) public {
        fei().transfer(to, amount);
    }

    function approve(address account) public {
        fei().approve(account, type(uint).max);
    }

    function sendFeiFrom(
        address from,
        address to,
        uint256 amount
    ) public {
        fei().transferFrom(from, to, amount);
    }
}