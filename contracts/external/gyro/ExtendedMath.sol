//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./abdk/ABDKMath64x64.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";

/**
 * @notice This contract contains math related utilities that allows to
 * compute fixed-point exponentiation or perform scaled arithmetic operations
 */
library ExtendedMath {
    using ABDKMath64x64 for int128;
    using ABDKMath64x64 for uint256;
    using SafeMath for uint256;

    uint256 constant decimals = 18;
    uint256 constant decimalScale = 10**decimals;

    /**
     * @notice Computes x**y where both `x` and `y` are fixed-point numbers
     */
    function powf(int128 _x, int128 _y) internal pure returns (int128 _xExpy) {
        // 2^(y * log2(x))
        return _y.mul(_x.log_2()).exp_2();
    }

    /**
     * @notice Computes `value * base ** exponent` where all of the parameters
     * are fixed point numbers scaled with `decimal`
     */
    function mulPow(
        uint256 value,
        uint256 base,
        uint256 exponent,
        uint256 decimal
    ) internal pure returns (uint256) {
        int128 basef = base.fromScaled(decimal);
        int128 expf = exponent.fromScaled(decimal);

        return powf(basef, expf).mulu(value);
    }

    /**
     * @notice Multiplies `a` and `b` scaling the result down by `_decimals`
     * `scaledMul(a, b, 18)` with an initial scale of 18 decimals for `a` and `b`
     * would keep the result to 18 decimals
     * The result of the computation is floored
     */
    function scaledMul(
        uint256 a,
        uint256 b,
        uint256 _decimals
    ) internal pure returns (uint256) {
        return a.mul(b).div(10**_decimals);
    }

    function scaledMul(uint256 a, uint256 b) internal pure returns (uint256) {
        return scaledMul(a, b, decimals);
    }

    /**
     * @notice Divides `a` and `b` scaling the result up by `_decimals`
     * `scaledDiv(a, b, 18)` with an initial scale of 18 decimals for `a` and `b`
     * would keep the result to 18 decimals
     * The result of the computation is floored
     */
    function scaledDiv(
        uint256 a,
        uint256 b,
        uint256 _decimals
    ) internal pure returns (uint256) {
        return a.mul(10**_decimals).div(b);
    }

    /**
     * @notice See `scaledDiv(uint256 a, uint256 b, uint256 _decimals)`
     */
    function scaledDiv(uint256 a, uint256 b) internal pure returns (uint256) {
        return scaledDiv(a, b, decimals);
    }

    /**
     * @notice Computes a**b where a is a scaled fixed-point number and b is an integer
     * This keeps a scale of `_decimals` for `a`
     * The computation is performed in O(log n)
     */
    function scaledPow(
        uint256 base,
        uint256 exp,
        uint256 _decimals
    ) internal pure returns (uint256) {
        uint256 result = 10**_decimals;

        while (exp > 0) {
            if (exp % 2 == 1) {
                result = scaledMul(result, base, _decimals);
            }
            exp /= 2;
            base = scaledMul(base, base, _decimals);
        }
        return result;
    }

    /**
     * @notice See `scaledPow(uint256 base, uint256 exp, uint256 _decimals)`
     */
    function scaledPow(uint256 base, uint256 exp) internal pure returns (uint256) {
        return scaledPow(base, exp, decimals);
    }
}
