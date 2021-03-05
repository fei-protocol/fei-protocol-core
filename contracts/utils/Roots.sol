pragma solidity ^0.6.0;

import "@uniswap/lib/contracts/libraries/Babylonian.sol";

library Roots {
    // Newton's method https://en.wikipedia.org/wiki/Cube_root#Numerical_methods
    function cubeRoot(uint256 y) internal pure returns (uint256 z) {
        if (y > 7) {
            z = y;
            uint256 x = y / 3 + 1;
            while (x < z) {
                z = x;
                x = (y / (x * x) + (2 * x)) / 3;
            }
        } else if (y != 0) {
            z = 1;
        }
    }

    function sqrt(uint256 y) internal pure returns (uint256) {
        return Babylonian.sqrt(y);
    }
}
