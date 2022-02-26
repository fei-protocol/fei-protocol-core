// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface ITribe {
    function mint(address to, uint256 amount) external;
}

contract MockTribeMinter {
    ITribe public tribe;

    constructor(ITribe _tribe) {
        tribe = _tribe;
    }

    function mint(address to, uint256 amount) external {
        tribe.mint(to, amount);
    }
}
