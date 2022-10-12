// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IRariManager {
    function depositFees() external;

    function withdraw(string calldata, uint256) external;

    function setFundRebalancer(address) external;
}
