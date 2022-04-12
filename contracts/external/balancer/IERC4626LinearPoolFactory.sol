// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IERC4626LinearPoolFactory {
    function create(
        string memory name,
        string memory symbol,
        address mainToken,
        address wrappedToken,
        uint256 upperTarget,
        uint256 swapFeePercentage,
        address owner
    ) external returns (address);
}
