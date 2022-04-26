// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title interface for putting a rate limit on how fast a contract can perform an action, e.g. Minting
/// @author Fei Protocol
interface IRateLimitedV2 {
    // ----------- Errors -----------
    error InvalidRateLimit();
    error InvalidBufferCap();
    error RateLimitExceeded();

    // ----------- Events -----------
    event BufferUsed(uint256 amountUsed, uint256 bufferRemaining);
    event BufferReplenished(uint256 amountReplenished, uint256 bufferRemaining);
    event BufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap);
    event RateLimitPerSecondUpdate(
        uint256 oldRateLimitPerSecond,
        uint256 newRateLimitPerSecond
    );

    // ----------- View API -----------

    /// @notice the amount of action that can be used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    function getBuffer() external view returns (uint112);

    // ----------- State-Chagnging API ------

    /// @notice sets the maximum rate limit
    function setMaxRateLimit(uint112) external;

    /// @notice sets the buffer cap
    function setBufferCap(uint112) external;

    /// @notice sets the rate limit
    function setRateLimit(uint112) external;
}
