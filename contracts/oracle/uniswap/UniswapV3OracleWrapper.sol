// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";

import {CoreRef} from "../../refs/CoreRef.sol";
import {IOracle, Decimal} from "../IOracle.sol";
import {IUniswapMathWrapper} from "./IUniswapMathWrapper.sol";


/// @title UniswapV3 TWAP Oracle wrapper
/// @notice Reads a UniswapV3 TWAP oracle and wraps it under the standard Fei interface
contract UniswapV3OracleWrapper is IOracle, CoreRef {
  using Decimal for Decimal.D256;

  address public immutable pool;
  uint32 public immutable secondsAgo;
  IUniswapMathWrapper private immutable uniswapMathWrapper;

  constructor(
    address _core,
    address _pool,
    uint32 _secondsAgo,
    address _uniswapMathWrapper
  ) CoreRef(_core) {
    pool = _pool;
    secondsAgo = _secondsAgo;
    uniswapMathWrapper = IUniswapMathWrapper(_uniswapMathWrapper);
  }

  /// @notice updates the oracle price
  /// @dev no-op, Uniswap is updated automatically
  function update() external view override {}

    // ----------- Getters -----------

  function read() external view override returns (Decimal.D256 memory, bool) {
    uint256 rawPrice = uniswapMathWrapper.calculatePrice(pool, secondsAgo);
    bool valid = !paused() && rawPrice > 0;
    Decimal.D256 memory value = Decimal.from(rawPrice);
    return (value, valid);
  }

  /// @notice no-op, Uniswap V3 constantly updates the price
  function isOutdated() external view override returns (bool) {}
}