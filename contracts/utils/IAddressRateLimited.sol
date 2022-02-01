// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title interface for putting a rate limit on how fast a contract can perform minting
/// @author Fei Protocol
interface IAddressRateLimited {

    /// @notice maximum rate limit per second governance can set for this contract
    function MAX_RATE_LIMIT_PER_SECOND_PER_ADDRESS() external view returns(uint256);

    /// @notice maximum rate limit per second governance can set for this contract
    function MAX_BUFFER_CAP() external view returns(uint256);

    /// @notice the rate per second for each minter
    function rateLimitPerSecond(address) external view returns(uint256);

    /// @notice the last time the buffer was used by each minter
    function lastBufferUsedTime(address) external view returns(uint256);

    /// @notice the cap of the buffer that can be used at once
    function bufferCap(address) external view returns(uint256);

    /// @notice a flag for whether to allow partial actions to complete if the buffer is less than amount
    function doPartialAction() external view returns(bool);

    // ----------- Events -----------
    
    /// @notice emitted when a buffer is eaten into
    event BufferUsed(address minter, uint256 amountUsed, uint256 bufferRemaining);
    
    /// @notice emitted when a buffer cap is updated
    event BufferCapUpdate(address minter, uint256 oldBufferCap, uint256 newBufferCap);
    
    /// @notice emitted when rate limit is updated
    event RateLimitPerSecondUpdate(address minter, uint256 oldRateLimitPerSecond, uint256 newRateLimitPerSecond);

    /// @notice add an authorized minter contract
    /// @param _minter the new address to add as a minter
    /// @param _rateLimitPerSecond the rate limit per second for this minter
    /// @param _bufferCap  the buffer cap for this minter
    function addMinter(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) external;

    /// @notice add an authorized minter contract
    /// @param _minter the address whose buffer and rate limit per second will be set
    /// @param _rateLimitPerSecond the new rate limit per second for this minter
    /// @param _bufferCap  the new buffer cap for this minter
    function updateMinter(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) external;

    /// @notice remove an authorized minter contract
    /// @param _minter the address to remove from the whitelist of minters
    function removeMinter(address _minter) external;

    /// @notice set the rate limit per second
    /// @param minter the address whose buffer will be set
    /// @param newRateLimitPerSecond the new rate limit per second for this minter
    function setRateLimitPerSecond(address minter, uint256 newRateLimitPerSecond) external;

    /// @notice set the buffer cap
    /// @param minter the address whose buffer will be set
    /// @param newBufferCap the new buffer cap for this minter
    function setBufferCap(address minter, uint256 newBufferCap) external;

    /// @notice the amount of action used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    /// @param minter the address whose buffer will be returned
    function buffer(address minter) external view returns(uint256);
}
