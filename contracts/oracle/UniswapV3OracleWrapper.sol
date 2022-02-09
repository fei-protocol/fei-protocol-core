// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {OracleLibrary} from "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import {TickMath} from "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import {FullMath} from "@uniswap/v3-core/contracts/libraries/FullMath.sol";

import {IOracle, Decimal} from "./IOracle.sol";
import {CoreRef} from "../refs/CoreRef.sol";

/// @title UniswapV3 TWAP Oracle wrapper
/// @notice Reads a UniswapV3 TWAP oracle and wraps it under the standard Fei interface
contract UniswapV3OracleWrapper is IOracle {
  using Decimal for Decimal.D256;

  address public immutable pool;
  uint32 public immutable secondsAgo;

  constructor(address _core, address _pool, uint32 _secondsAgo) CoreRef(_core) {
    pool = _pool;
    secondsAgo = _secondsAgo;
  }

  /// @notice updates the oracle price
  /// @dev no-op, Uniswap is updated automatically
  function update() external view override {}

    // ----------- Getters -----------

  function read() external view override returns (Decimal.D256 memory, bool) {
    // Time weighted average tick represents the geometric time weighted average price of the pool
    // Reported in log base sqrt(1.0001) of token1 / token0.
    (int24 arithmeticMeanTick, ) = OracleLibrary.consult(pool, secondsAgo);

    // Convert tick to sqrt price
    uint160 sqrtPrice = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);

    // Get full price
    uint256 price = FullMath.mulDiv(sqrtPrice, sqrtPrice, FixedPoint96.Q96);
    bool valid = !paused() && price > 0;
    return (price, valid);
  }

  function isOutdated() external view override returns (bool) {}
}