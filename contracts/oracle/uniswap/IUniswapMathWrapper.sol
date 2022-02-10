// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IUniswapMathWrapper {
  function calculatePrice(address pool, uint32 secondsAgo) external view returns (uint256);
}