## `ExtendedMath`

This contract contains math related utilities that allows to
compute fixed-point exponentiation or perform scaled arithmetic operations




### `powf(int128 _x, int128 _y) → int128 _xExpy` (internal)

Computes x**y where both `x` and `y` are fixed-point numbers



### `mulPow(uint256 value, uint256 base, uint256 exponent, uint256 decimal) → uint256` (internal)

Computes `value * base ** exponent` where all of the parameters
are fixed point numbers scaled with `decimal`



### `scaledMul(uint256 a, uint256 b, uint256 _decimals) → uint256` (internal)

Multiplies `a` and `b` scaling the result down by `_decimals`
`scaledMul(a, b, 18)` with an initial scale of 18 decimals for `a` and `b`
would keep the result to 18 decimals
The result of the computation is floored



### `scaledMul(uint256 a, uint256 b) → uint256` (internal)





### `scaledDiv(uint256 a, uint256 b, uint256 _decimals) → uint256` (internal)

Divides `a` and `b` scaling the result up by `_decimals`
`scaledDiv(a, b, 18)` with an initial scale of 18 decimals for `a` and `b`
would keep the result to 18 decimals
The result of the computation is floored



### `scaledDiv(uint256 a, uint256 b) → uint256` (internal)

See `scaledDiv(uint256 a, uint256 b, uint256 _decimals)`



### `scaledPow(uint256 base, uint256 exp, uint256 _decimals) → uint256` (internal)

Computes a**b where a is a scaled fixed-point number and b is an integer
This keeps a scale of `_decimals` for `a`
The computation is performed in O(log n)



### `scaledPow(uint256 base, uint256 exp) → uint256` (internal)

See `scaledPow(uint256 base, uint256 exp, uint256 _decimals)`






