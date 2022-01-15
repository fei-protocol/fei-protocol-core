// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface ILiquidityBootstrappingPoolFactory {
    function create(
        string memory name,
        string memory symbol,
        address[] memory tokens,
        uint256[] memory weights,
        uint256 swapFeePercentage,
        address owner,
        bool swapEnabledOnStart
    ) external returns (address);
}
