// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

library Constants {
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;
    
    /// @notice WETH9 address
    IWETH public constant WETH = IWETH(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);
}
