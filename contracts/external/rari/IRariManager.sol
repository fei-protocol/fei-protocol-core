// SPDX-License-Identifier: MIT
pragma solidity =0.8.13;

interface IRariManager {
    function depositFees() external;

    function withdraw(string memory, uint256) external;
}
