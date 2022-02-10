// SPDX-License-Identifier: GPL-3.0-or-later
// solhint-disable-next-line
pragma solidity >=0.4.0 <0.8.0;

import {OracleLibrary} from "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import {TickMath} from "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";

/// @title Wrapper around Uniswap V3 Oracle Maths operations
/// @dev Required due to differing compiler versions
contract UniswapMathWrapper {
  using OracleLibrary for address;
  using TickMath for int24;
  using FullMath for uint160;

  function calculatePrice(address pool, uint32 secondsAgo) external view returns (uint256) {
    (int24 arithmeticMeanTick, ) = pool.consult(secondsAgo);
    uint160 sqrtPrice = arithmeticMeanTick.getSqrtRatioAtTick();
    uint256 price = sqrtPrice.mulDiv(sqrtPrice, FixedPoint96.Q96);
    return price;
  }
}

