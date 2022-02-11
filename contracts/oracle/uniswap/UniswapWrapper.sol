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

  function calculatePrice(
    address pool,
    uint32 secondsAgo,
    address oracleInputToken,
    address oracleOutputToken
  ) external view returns (uint256) {
    (int24 arithmeticMeanTick, ) = OracleLibrary.consult(pool, secondsAgo);

    // Get tokens in same order as Uniswap
    (address token0, address token1) = sortTokensAccordingToUniswap(oracleInputToken, oracleOutputToken);

    // Ticks are based on the ratio between token0:token1 so if the input token is token1 then
    // we need to treat the tick as an inverse
    bool invertTick = token0 == oracleInputToken ? false : true;
    if (invertTick) {
      // TODO: Invert tick price
    }
    
    // sqrtPrice = ratio of the two assets (token1/token0)
    uint160 sqrtPrice = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);
    uint256 price = FullMath.mulDiv(sqrtPrice, sqrtPrice, FixedPoint96.Q96);
    return price;
  }

  function getObservationCardinality(address pool) external view returns (uint16) {
    (, , , uint16 observationCardinality, , , ) = IUniswapV3Pool(pool).slot0();
    return observationCardinality;
  }

  /// @notice Utility function to sort tokens, needed when calculating the tick, in the same order
  // as Uniswap does and assigns on pools
  function sortTokensAccordingToUniswap(address tokenA, address tokenB) internal view returns (address, address) {
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    return (token0, token1);
  }
}

