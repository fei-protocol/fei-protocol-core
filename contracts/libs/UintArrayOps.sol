// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/math/SafeCast.sol";

library UintArrayOps {
    using SafeCast for uint256;

    function sum(uint[] memory array) internal pure returns (uint256 _sum) {
        for (uint256 i=0; i < array.length; i++) {
            _sum += array[i];
        }

        return _sum;
    }

    function signedDifference(uint256[] memory a, uint256[] memory b) internal pure returns (int256[] memory _difference) {
        require(a.length == b.length, "Arrays must be the same length");

        _difference = new int256[](a.length);

        for (uint256 i=0; i < a.length; i++) {
            _difference[i] = a[i].toInt256() - b[i].toInt256();
        }

        return _difference;
    }

    /// @dev given two int arrays a & b, returns an array c such that c[i] = a[i] - b[i], with negative values truncated to 0
    function positiveDifference(uint256[] memory a, uint256[] memory b) internal pure returns (uint256[] memory _positiveDifference) {
        require(a.length == b.length,  "Arrays must be the same length");

        _positiveDifference = new uint256[](a.length);

        for (uint256 i=0; i < a.length; i++) {
            if (a[i] > b[i]) {
                _positiveDifference[i] = a[i] - b[i];
            }
        }

        return _positiveDifference;
    }
}