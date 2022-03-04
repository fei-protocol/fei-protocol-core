// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {RateLimited} from "./RateLimited.sol";

/// @notice Rate Limited Contract that allows replenishment of buffer
/// @author Fei Protocol
abstract contract RateLimitedReplenishable is RateLimited {
    constructor(
        uint256 _maxRateLimitPerSecond,
        uint256 _rateLimitPerSecond,
        uint256 _bufferCap,
        bool _doPartialAction
    )
        RateLimited(
            _maxRateLimitPerSecond,
            _rateLimitPerSecond,
            _bufferCap,
            _doPartialAction
        )
    {}

    /// @notice function to replenish buffer
    /// @param amount to increase buffer by if under buffer cap
    function _replenishBuffer(uint256 amount) internal {
        uint256 newBuffer = buffer();

        /// cannot replenish any further if already at buffer cap
        if (newBuffer == bufferCap) {
            return;
        }

        _bufferStored = newBuffer + amount;
    }

    /// @notice return buffer stored to validate state transitions
    function bufferStored() public view returns (uint256) {
        return _bufferStored;
    }
}
