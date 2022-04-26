// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {CoreRef} from "../refs/CoreRef.sol";
import {IRateLimited} from "./IRateLimited.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title abstract contract for putting a rate limit on how fast a contract can perform an action e.g. Minting
/// @author Fei Protocol
abstract contract RateLimited is IRateLimited, CoreRef {
    using SafeCast for *;

    /// @notice maximum rate limit per second; changeable by governance
    uint256 public currentMaxRateLimit;

    /// @notice the rate per second for this contract
    uint256 public rateLimit;

    /// @notice the last time the buffer was used by the contract
    uint32 public bufferLastUpdate;

    /// @notice the cap of the buffer that can be used at once
    uint256 public bufferCap;

    /// @notice the buffer at the timestamp of lastBufferUsedTime
    uint256 private bufferStored;

    constructor(
        uint256 maximumRateLimit,
        uint256 initialRateLimit,
        uint256 theBufferCap
    ) {
        bufferLastUpdate = block.timestamp.toUint32();

        _setBufferCap(theBufferCap);
        bufferStored = theBufferCap;

        if (initialRateLimit > maximumRateLimit) revert InvalidRateLimit();

        _setRateLimit(initialRateLimit);

        currentMaxRateLimit = maximumRateLimit;
    }

    // ----------- Public View-Only Methods ----------

    /// @notice the amount of action used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    function getBuffer() public view override returns (uint112) {
        return
            uint112(
                Math.min(
                    (bufferStored +
                        (rateLimit * (block.timestamp - bufferLastUpdate))),
                    bufferCap
                )
            );
    }

    // ----------- Only Governor State-Changing Methods -----------

    /// @notice sets the maximum rate limit
    /// @dev if the new maximum is lower than the current rate limit,
    /// the current rate limit will be lowered to the new maximum.
    function setMaxRateLimit(uint256 newMaxRateLimit)
        external
        virtual
        override
        onlyGovernor
    {
        currentMaxRateLimit = newMaxRateLimit;

        if (newMaxRateLimit < rateLimit) {
            setRateLimit(newMaxRateLimit);
        }
    }

    // ----------- Only Governor or Admin State-Changing Methods ----------

    /// @notice set the rate limit
    function setRateLimit(uint256 newRateLimit)
        public
        virtual
        override
        onlyGovernorOrAdmin
    {
        if (newRateLimit > currentMaxRateLimit) revert InvalidRateLimit();

        bufferStored = getBuffer();
        bufferLastUpdate = block.timestamp.toUint32();

        _setRateLimit(newRateLimit);
    }

    /// @notice set the buffer cap
    function setBufferCap(uint256 newBufferCap)
        external
        virtual
        override
        onlyGovernorOrAdmin
    {
        _setBufferCap(newBufferCap);
    }

    // ----------- Internal Methods ----------

    /** 
        @notice the method that enforces the rate limit. Decreases buffer by "amount". 
    */
    function _depleteBuffer(uint256 amount) internal {
        uint256 currentBuffer = getBuffer();

        if (amount > currentBuffer) revert RateLimitExceeded();

        // Update buffer stored & buffer last updated amounts
        bufferStored = currentBuffer - amount;
        bufferLastUpdate = block.timestamp.toUint32();

        emit BufferUsed(amount, bufferStored);
    }

    /// @notice function to replenish buffer
    /// @param amount to increase buffer by if under buffer cap
    function _replenishBuffer(uint256 amount) internal {
        uint256 currentBuffer = getBuffer();
        uint256 currentBufferCap = bufferCap;

        bufferLastUpdate = block.timestamp.toUint32();
        bufferStored = Math.min(currentBuffer + amount, currentBufferCap);

        emit BufferReplenished(amount, bufferStored);
    }

    function _setRateLimit(uint256 newRateLimit) internal {
        emit RateLimitPerSecondUpdate(rateLimit, newRateLimit);
        rateLimit = newRateLimit;
    }

    function _setBufferCap(uint256 newBufferCap) internal {
        emit BufferCapUpdate(bufferCap, newBufferCap);

        bufferCap = newBufferCap;
        bufferStored = getBuffer();
        bufferLastUpdate = block.timestamp.toUint32();
    }
}
