// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity >=0.4.0 <0.8.0;

import {UniswapWrapper} from "../oracle/uniswap/UniswapWrapper.sol";

/// @title MockUniswapWrapper
/// @dev Used to test internal methods on UniswapWrapper that would not otherwise be
/// available
contract MockUniswapWrapper is UniswapWrapper {
    constructor() UniswapWrapper() {}

    function callCalculateDecimalNormaliser(
        uint8 _token0Decimals,
        uint8 _token1Decimals
    ) external view returns (uint256, bool) {
        return calculateDecimalNormaliser(_token0Decimals, _token1Decimals);
    }
}
