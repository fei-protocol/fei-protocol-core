// SPDX-License-Identifier: GPL-3.0-or-later

pragma solidity >=0.4.0 <0.8.0;

import {SafeCast} from "@openzeppelinv0.7/utils/SafeCast.sol";
import {OracleLibrary} from "@uniswap/v3-periphery/contracts/libraries/OracleLibrary.sol";
import {TickMath} from "@uniswap/v3-core/contracts/libraries/TickMath.sol";
import {FullMath} from "@uniswap/v3-core/contracts/libraries/FullMath.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";

/// @title Wrapper around Uniswap V3 Oracle Maths operations
/// @notice Responsibility of this contract is to calculate prices. It is not reponsible for authentication and safety params
/// @dev Required due to differing compiler versions
contract UniswapWrapper {
  using SafeCast for int256;

  /// @notice Calculate the TWAP price based on a Uniswap V3 pool
  /// @param pool The Uniswap V3 pool containing the input and output tokens
  /// @param twapPeriod Period over which the TWAP (time weighted average price) is calculated
  /// @param oracleInputToken Input token
  /// @param oracleOutputToken Output token
  /// @param inputTokenDecimals Number of decimals on the input token
  /// @param outputTokenDecimals Number of decimals on the output token
  /// @param precision Required precision of oracle price
  /// @dev This function calculates the time weighted average price for an input token in terms of an output token
  /// 1. Get the difference in cumulative tick value between two times - the twapPeriod
  /// 2. Calculate the mean price over this period of time. i.e. cumulativeTickValueDiff / twapPeriod
  ///     - Due to the units used by Uniswap, this value is actually the square root of the price to the power of 2^96
  /// 4. Convert from these units to just price, and adjust for any decimal number differences between the input and output tokens
  function calculatePrice(
    address pool,
    uint32 twapPeriod,
    address oracleInputToken,
    address oracleOutputToken,
    uint8 inputTokenDecimals,
    uint8 outputTokenDecimals,
    uint256 precision
  ) external view returns (uint256) {
    (address token0, address token1) = sortTokensAccordingToUniswap(oracleInputToken, oracleOutputToken);
    bool invertTick = token0 == oracleInputToken ? false : true;

    uint256 unnormalisedPrice = getUnNormalisedPrice(twapPeriod, pool);
    (uint256 decimalNormaliser, bool invertDecNormaliser) = calculateDecimalNormaliser(inputTokenDecimals, outputTokenDecimals);

    uint256 numerator;
    uint256 denominator;
    if (!invertTick) {
      // price = ((sqrtPrice*2^96) * (sqrtPrice*2^96) * decimalNormaliser) / (2^96)^2
      numerator = !invertDecNormaliser ? 
                    FullMath.mulDiv(unnormalisedPrice, decimalNormaliser, uint256(1))
                    :
                    FullMath.mulDiv(unnormalisedPrice, uint256(1), decimalNormaliser);
      denominator = 2**192;
    } else {
      // Invert the calculation in the case where Uniswap stores the tokens in the inverse
      // ratio to that which the oracle requires the price.
      // i.e. uniswap may quote the price as outputToken/inputToken, whereas we may want inputToken/outputToken
      
      //price = ((2^96)^2 * decimalNormaliser) / (sqrtPrice*2^96) * (sqrtPrice*2^96)
      numerator = !invertDecNormaliser ?
                    FullMath.mulDiv(2**192, decimalNormaliser, uint256(1))
                    :
                    FullMath.mulDiv(2**192, uint256(1), decimalNormaliser);
      denominator = unnormalisedPrice;      
    }
    return FullMath.mulDiv(numerator, precision, denominator);
  }

  /// @notice Get the unnormalised time weighted average price (TWAP) (decimal and invertion considerations not applied)
  /// @param _twapPeriod Period of time in seconds over which the TWAP is calculated
  /// @param _pool Uniswap pool which 
  function getUnNormalisedPrice(uint32 _twapPeriod, address _pool) internal view returns (uint256) {
    // Ticks based on the ratio between token0:token1. If inputToken is token1 rather than token0, invert
    uint32[] memory twapInterval = new uint32[](2);
    twapInterval[0] = _twapPeriod; // from 
    twapInterval[1] = 0; // to

    (int56[] memory tickCumulatives, ) = IUniswapV3Pool(_pool).observe(twapInterval);
    int56 tickCumulativesDiff = tickCumulatives[1] - tickCumulatives[0];
    int24 arithmeticMeanTick = int24(tickCumulativesDiff / _twapPeriod);

    // Uniswap scales values by 2**96, X96 represents that
    // sqrtPriceX96 represents the square root of the token ratio, multiplied by 2**96
    uint160 sqrtPriceX96 = TickMath.getSqrtRatioAtTick(arithmeticMeanTick);
    return FullMath.mulDiv(uint256(sqrtPriceX96), uint256(sqrtPriceX96), uint256(1));
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
  function calculateDecimalNormaliser(uint8 _token0Decimals, uint8 _token1Decimals) internal view returns (uint256, bool) {    
    bool invertDecNormaliser;
    if (_token0Decimals >= _token1Decimals) {
      invertDecNormaliser = false;
      return (10**(_token0Decimals - _token1Decimals), invertDecNormaliser);
    } else {
      invertDecNormaliser = true;
      return (10**(_token1Decimals - _token0Decimals), invertDecNormaliser);
    }
  }
}