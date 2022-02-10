// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title Mock Uniswap V3 Pool
/// @notice Used for testing the Uniswap V3 TWAP oracle. Mock data for consult() method
contract MockUniswapV3Pool {
  function consult(address pool, uint32 secondsAgo) external view returns (uint256) {
    return 0;
  }  
}