// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title interface for putting a rate limit on how fast a contract can perform an action, e.g. Minting
/// @author Fei Protocol
interface IMultiRateLimited {
    /// @notice the struct containing all information per rate limited address
    struct RateLimitData {
        uint32 bufferLastUpdate;
        uint112 bufferCap;
        uint112 bufferStored;
        uint112 rateLimit;
    }

    // ----------- Errors -----------

    error InvalidMultiMaxBufferCap();
    error InvalidMultiMaxRateLimit();
    error InvalidMultiRateLimit();
    error InvalidMultiBufferCap();
    error AlreadyRateLimited(address rateLimited);
    error NotRateLimited(address notRatelLimited);
    error MultiRateLimitExceeded();

    // ----------- Events -----------

    /// @notice emitted when a buffer is eaten into
    event IndividualBufferUsed(
        address rateLimitedAddress,
        uint256 amountUsed,
        uint256 bufferRemaining
    );

    /// @notice emitted when rate limit is updated
    event IndividualRateLimitPerSecondUpdate(
        address rateLimitedAddress,
        uint256 oldRateLimitPerSecond,
        uint256 newRateLimitPerSecond
    );

    /// @notice emitted when the non gov buffer cap max is updated
    event MultiBufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap);

    /// @notice emitted when the non gov buffer rate limit per second max is updated
    event MultiMaxRateLimitPerSecondUpdate(
        uint256 oldMaxRateLimitPerSecond,
        uint256 newMaxRateLimitPerSecond
    );

    // ----------- View API -----------

    /// @notice the last time the buffer was used by each address
    function getBufferLastUpdate(address) external view returns (uint32);

    /// @notice the rate per second for each address
    function getRateLimit(address) external view returns (uint112);

    /// @notice the cap of the buffer that can be used at once
    function getBufferCap(address) external view returns (uint112);

    /// @notice the amount of action that can be used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    function getBuffer(address) external view returns (uint112);

    // ----------- Governance State Changing API -----------

    /// @notice update max rate limit
    function updateMaxRateLimit(uint112 newMaxRateLimit) external;

    /// @notice update max buffer cap
    function updateMaxBufferCap(uint112 newBufferCap) external;

    /// @notice add an authorized contract, its per second replenishment and buffer
    function addAddress(
        address,
        uint112,
        uint112
    ) external;

    /// @notice update an authorized contract
    function updateAddress(
        address,
        uint112,
        uint112
    ) external;

    /// @notice remove an authorized contract
    function removeAddress(address) external;
}
