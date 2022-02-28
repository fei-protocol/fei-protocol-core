// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

abstract contract CToken {
    function getCash() external view returns (uint256) {}
}
