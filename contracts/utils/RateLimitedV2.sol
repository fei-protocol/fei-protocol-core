// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {CoreRef} from "../refs/CoreRef.sol";
import {IRateLimitedV2} from "./IRateLimitedV2.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title abstract contract for putting a rate limit on how fast a contract can perform an action e.g. Minting
/// @author Fei Protocol
contract RateLimitedV2 is IRateLimitedV2, CoreRef {
    using SafeCast for *;

    /// @notice maximum rate limit per second; changeable by governance
    uint112 public currentMaxRateLimit;

    /// @notice the rate per second for this contract
    uint112 public rateLimit;

    /// @notice the cap of the buffer that can be used at once
    uint112 public bufferCap;

    /// @notice the buffer at the timestamp of lastBufferUsedTime
    uint112 private bufferStored;

    /// @notice the last time the buffer was used by the contract
    uint32 public bufferLastUpdate;

    constructor(
        address core,
        uint112 maximumRateLimit,
        uint112 initialRateLimit,
        uint112 theBufferCap
    ) CoreRef(core) {
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
    function setMaxRateLimit(uint112 newMaxRateLimit)
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
    function setRateLimit(uint112 newRateLimit)
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
    function setBufferCap(uint112 newBufferCap)
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
    function _depleteBuffer(uint112 amount) internal {
        uint112 currentBuffer = getBuffer();

        if (amount > currentBuffer) revert RateLimitExceeded();

        // Update buffer stored & buffer last updated amounts
        uint32 thisBufferLastUpdate = block.timestamp.toUint32();
        bufferStored = currentBuffer - amount;
        bufferLastUpdate = thisBufferLastUpdate;

        emit BufferUsed(amount, bufferStored);
    }

    /// @notice function to replenish buffer
    /// @param amount to increase buffer by if under buffer cap
    function _replenishBuffer(uint112 amount) internal {
        uint256 currentBuffer = getBuffer();
        uint256 currentBufferCap = bufferCap;

        bufferLastUpdate = block.timestamp.toUint32();
        bufferStored = uint112(
            Math.min(currentBuffer + amount, currentBufferCap)
        );

        emit BufferReplenished(amount, bufferStored);
    }

    function _setRateLimit(uint112 newRateLimit) internal {
        emit RateLimitPerSecondUpdate(rateLimit, newRateLimit);
        rateLimit = newRateLimit;
    }

    function _setBufferCap(uint112 newBufferCap) internal {
        emit BufferCapUpdate(bufferCap, newBufferCap);

        bufferCap = newBufferCap;
        bufferStored = getBuffer();
        bufferLastUpdate = block.timestamp.toUint32();
    }
}
