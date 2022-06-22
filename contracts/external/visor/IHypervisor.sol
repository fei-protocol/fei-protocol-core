// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

interface IHypervisor {
    function withdraw(
        uint256 shares,
        address to,
        address from
    ) external returns (uint256 amount0, uint256 amount1);
}
