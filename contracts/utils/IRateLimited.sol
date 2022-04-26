// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title interface for putting a rate limit on how fast a contract can perform an action, e.g. Minting
/// @author Fei Protocol
interface IRateLimited {
    // ----------- Errors -----------
    error InvalidRateLimit();
    error InvalidBufferCap();
    error AlreadyRateLimited(address rateLimited);
    error NotRateLimited(address notRatelLimited);
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

    /// @notice the rate per second for each address
    function getRateLimit() external view returns (uint256);

    /// @notice the last time the buffer was used by each address
    function getBufferLastUpdate() external view returns (uint32);

    /// @notice the cap of the buffer that can be used at once
    function getBufferCap() external view returns (uint256);

    /// @notice the amount of action that can be used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    function getBuffer() external view returns (uint112);

    // ----------- State-Chagnging API ------

    /// @notice sets the maximum rate limit
    function setMaxRateLimit(uint256) external;

    /// @notice sets the buffer cap
    function setBufferCap(uint256) external;

    /// @notice sets the rate limit
    function setRateLimit(uint256) external;
}
