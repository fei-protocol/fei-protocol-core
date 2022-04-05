## `ABDKMath64x64`

*
Smart contract library of mathematical functions operating with signed
64.64-bit fixed point numbers.  Signed 64.64-bit fixed point number is
basically a simple fraction whose numerator is signed 128-bit integer and
denominator is 2^64.  As long as denominator is always the same, there is no
need to store it, thus in Solidity signed 64.64-bit fixed point numbers are
represented by int128 type holding only the numerator.
/




### `uint256toInt128(uint256 input) → int128` (internal)





### `int128toUint256(int128 input) → uint256` (internal)





### `int128toUint64(int128 input) → uint64` (internal)





### `fromInt(int256 x) → int128` (internal)

*
Convert signed 256-bit integer number into signed 64.64-bit fixed point
number.  Revert on overflow.





### `toInt(int128 x) → int64` (internal)

*
Convert signed 64.64 fixed point number into signed 64-bit integer number
rounding down.





### `fromUInt(uint256 x) → int128` (internal)

*
Convert unsigned 256-bit integer number into signed 64.64-bit fixed point
number.  Revert on overflow.





### `fromScaled(uint256 x, uint256 decimal) → int128` (internal)

*
Convert unsigned 256-bit integer number scaled with 10^decimals into signed 64.64-bit fixed point
number.  Revert on overflow.





### `toUInt(int128 x) → uint64` (internal)

*
Convert signed 64.64 fixed point number into unsigned 64-bit integer
number rounding down.  Revert on underflow.





### `from128x128(int256 x) → int128` (internal)

*
Convert signed 128.128 fixed point number into signed 64.64-bit fixed point
number rounding down.  Revert on overflow.





### `to128x128(int128 x) → int256` (internal)

*
Convert signed 64.64 fixed point number into signed 128.128 fixed point
number.





### `add(int128 x, int128 y) → int128` (internal)

*
Calculate x + y.  Revert on overflow.





### `sub(int128 x, int128 y) → int128` (internal)

*
Calculate x - y.  Revert on overflow.





### `mul(int128 x, int128 y) → int128` (internal)

*
Calculate x * y rounding down.  Revert on overflow.





### `muli(int128 x, int256 y) → int256` (internal)

*
Calculate x * y rounding towards zero, where x is signed 64.64 fixed point
number and y is signed 256-bit integer number.  Revert on overflow.





### `mulu(int128 x, uint256 y) → uint256` (internal)

*
Calculate x * y rounding down, where x is signed 64.64 fixed point number
and y is unsigned 256-bit integer number.  Revert on overflow.





### `div(int128 x, int128 y) → int128` (internal)

*
Calculate x / y rounding towards zero.  Revert on overflow or when y is
zero.





### `divi(int256 x, int256 y) → int128` (internal)

*
Calculate x / y rounding towards zero, where x and y are signed 256-bit
integer numbers.  Revert on overflow or when y is zero.





### `divu(uint256 x, uint256 y) → int128` (internal)

*
Calculate x / y rounding towards zero, where x and y are unsigned 256-bit
integer numbers.  Revert on overflow or when y is zero.





### `neg(int128 x) → int128` (internal)

*
Calculate -x.  Revert on overflow.





### `abs(int128 x) → int128` (internal)

*
Calculate |x|.  Revert on overflow.





### `inv(int128 x) → int128` (internal)

*
Calculate 1 / x rounding towards zero.  Revert on overflow or when x is
zero.





### `avg(int128 x, int128 y) → int128` (internal)

*
Calculate arithmetics average of x and y, i.e. (x + y) / 2 rounding down.





### `gavg(int128 x, int128 y) → int128` (internal)

*
Calculate geometric average of x and y, i.e. sqrt (x * y) rounding down.
Revert on overflow or in case x * y is negative.





### `pow(int128 x, uint256 y) → int128` (internal)

*
Calculate x^y assuming 0^0 is 1, where x is signed 64.64 fixed point number
and y is unsigned 256-bit integer number.  Revert on overflow.





### `sqrt(int128 x) → int128` (internal)

*
Calculate sqrt (x) rounding down.  Revert if x < 0.





### `log_2(int128 x) → int128` (internal)

*
Calculate binary logarithm of x.  Revert if x <= 0.





### `ln(int128 x) → int128` (internal)

*
Calculate natural logarithm of x.  Revert if x <= 0.





### `exp_2(int128 x) → int128` (internal)

*
Calculate binary exponent of x.  Revert on overflow.





### `exp(int128 x) → int128` (internal)

*
Calculate natural exponent of x.  Revert on overflow.








