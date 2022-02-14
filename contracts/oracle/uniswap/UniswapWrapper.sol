// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.4.0 <0.8.0;

import {OracleLibrary} from "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import {TickMath} from "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import "hardhat/console.sol";

/// @title Wrapper around Uniswap V3 Oracle Maths operations
/// @dev Required due to differing compiler versions
contract UniswapWrapper {

  /// @notice Calculate the TWAP price based on a Uniswap V3 pool
  /// @param pool The Uniswap V3 pool containing the input and output tokens
  /// @param twapPeriod Period over which the TWAP (time weighted average price) is calculated
  /// @param oracleInputToken Input token
  /// @param oracleOutputToken Output token
  /// @param inputTokenDecimals Number of decimals on the input token
  /// @param outputTokenDecimals Number of decimals on the output token
  function calculatePrice(
    address pool,
    uint32 twapPeriod,
    address oracleInputToken,
    address oracleOutputToken,
    uint8 inputTokenDecimals,
    uint8 outputTokenDecimals
  ) external view returns (uint256) {
    (address token0, address token1) = sortTokensAccordingToUniswap(oracleInputToken, oracleOutputToken);
    bool invertTick = token0 == oracleInputToken ? false : true;
    
    // Ticks based on the ratio between token0:token1. If inputToken is token1 rather than token0, invert
    uint32[] memory twapInterval = new uint32[](2);
    twapInterval[0] = twapPeriod; // from 
    twapInterval[1] = 0; // to

    (int56[] memory tickCumulatives, ) = IUniswapV3Pool(pool).observe(twapInterval);
    int56 tickCumulativesDiff = tickCumulatives[1] - tickCumulatives[0];
    int24 arithmeticMeanTick = int24(tickCumulativesDiff / int32(twapPeriod));

    // Uniswap scales values by 2**96. X96 represents that
    // sqrtPriceX96 represents the square root of the token ratio, multiplied by 2**96
    uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);
    
    // TODO: What happens if first token has more decimals than the second?
    uint256 decimalNormaliser = calculateDecimalNormaliser(inputTokenDecimals, outputTokenDecimals, invertTick);
    

    if (!invertTick) {
      // TODO: Add detailed explanation of what is happening
      uint256 numerator = uint256(sqrtPriceX96) * uint256(sqrtPriceX96) * decimalNormaliser;
      uint256 denominator = 2**192;
      return numerator / denominator;
    } else {
      // TODO: Explain what is happening with inversion, why factors are flipped 
      uint256 numerator = (2**192) * decimalNormaliser;
      uint256 denominator = uint256(sqrtPriceX96) * uint256(sqrtPriceX96);
      return numerator / denominator;
    }
  }

  /// @notice Sort tokens in the same way Uniswap does and assigns to token0 and token1. Needed when calculating price ratio
  /// @param inputToken Input token for the oracle
  /// @param outputToken Output token for the oracle
  function sortTokensAccordingToUniswap(address inputToken, address outputToken) internal view returns (address, address) {
    (address token0, address token1) = inputToken < outputToken ? (inputToken, outputToken) : (outputToken, inputToken);
    return (token0, token1);
  }

  /// @notice Determine the normalising factor between two tokens with a potentially different number of decimals
  /// @param _token0Decimals Number of decimals of the token corresponding to token0 on the Uniswap pool
  /// @param _token1Decimals Number of decimals of the token corresponding to token1 on the Uniswap pool
  /// @param invert Bool indicating whether normalising factor should be calculated in an inverse manner
  function calculateDecimalNormaliser(uint8 _token0Decimals, uint8 _token1Decimals, bool invert) internal view returns (uint256) {
    if (_token0Decimals > _token1Decimals) {
      return 10**(_token0Decimals - _token1Decimals);
    } else {
      // TODO: Validate this
      return 10**(_token1Decimals - _token0Decimals);
    }
  }
}

// TODO: Consider whether to add this in
// if (tickCumulativesDiff < 0 && (tickCumulativesDiff % int56(int32(twapPeriod)) != 0))
//     arithmeticMeanTick--;