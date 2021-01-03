pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "../utils/Roots.sol";

contract RootsWrapper {
    using Roots for uint;

    function cubeRoot(uint x) public pure returns (uint) {
        return x.cubeRoot();
    }

    function twoThirdsRoot(uint x) public pure returns (uint) {
        return x.twoThirdsRoot();
    }

    function sqrt(uint x) public pure returns (uint) {
        return x.sqrt();
    }
}