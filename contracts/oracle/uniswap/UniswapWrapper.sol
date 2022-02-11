// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

import {OracleLibrary} from "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import {TickMath} from "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

/// @title Wrapper around Uniswap V3 Oracle Maths operations
/// @dev Required due to differing compiler versions
contract UniswapWrapper {

  function calculatePrice(address pool, uint32 secondsAgo) external view returns (uint256) {
    (int24 arithmeticMeanTick, ) = OracleLibrary.consult(pool, secondsAgo);
    uint160 sqrtPrice = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);
    uint256 price = FullMath.mulDiv(sqrtPrice, sqrtPrice, FixedPoint96.Q96);
    return price;
  }

  function getObservationCardinality(address pool) external view returns (uint16) {
    (, , , uint16 observationCardinality, , , ) = IUniswapV3Pool(pool).slot0();
    return observationCardinality;
  }
}

