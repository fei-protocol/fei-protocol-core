// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

interface IMockUniswapV3Pool is IUniswapV3Pool {
  
  // NOTE: Not part of the UnisV3Pool interface. Test method only
function mockSetTokens(address _token0, address _token1) external;
}
