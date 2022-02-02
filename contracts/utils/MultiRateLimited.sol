// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "./RateLimited.sol";
import "./IMultiRateLimited.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title contract for putting a rate limit on how fast an address can perform an action e.g. Minting
/// there are two buffers, one buffer which is each individual addresses's current buffer,
/// and then there is a global buffer which is the buffer that each individual address must respect as well
/// @author Fei Protocol
contract MultiRateLimited is RateLimited, IMultiRateLimited {
    using SafeCast for *;

    /// @notice the struct containing all information per rate limited address
    struct RateLimitData {
        uint32 lastBufferUsedTime;
        uint144 bufferCap;
        uint112 rateLimitPerSecond;
        uint144 bufferStored;
    }

    /// @notice rate limited address information
    mapping (address => RateLimitData) public rateLimitPerAddress;

    constructor(
        address coreAddress,
        uint256 _maxRateLimitPerSecond,
        uint256 _rateLimitPerSecond,
        uint256 _bufferCap,
        uint256 maxBufferCap,
        bool _doPartialAction
    )
        CoreRef(coreAddress)
        RateLimited(_maxRateLimitPerSecond, _rateLimitPerSecond, _bufferCap, _doPartialAction)
    {}

    /// @notice add an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the new address to add as a rateLimitedAddress
    /// @param _rateLimitPerSecond the rate limit per second for this rateLimitedAddress
    /// @param _bufferCap  the buffer cap for this rateLimitedAddress
    function addAddress(address rateLimitedAddress, uint112 _rateLimitPerSecond, uint144 _bufferCap) external virtual override onlyGovernorOrAdmin {
        require(_bufferCap <= bufferCap, "MultiRateLimited: new buffercap too high");

        RateLimitData memory rateLimitData = RateLimitData({
            lastBufferUsedTime: _blockTimestamp(),
            bufferCap: _bufferCap,
            rateLimitPerSecond: _rateLimitPerSecond,
            bufferStored: _bufferCap
        });

        rateLimitPerAddress[rateLimitedAddress] = rateLimitData;

        emit IndividualRateLimitPerSecondUpdate(rateLimitedAddress, 0, _rateLimitPerSecond);
    }

    /// @notice add an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the address whose buffer and rate limit per second will be set
    /// @param _rateLimitPerSecond the new rate limit per second for this rateLimitedAddress
    /// @param _bufferCap  the new buffer cap for this rateLimitedAddress
    function updateAddress(address rateLimitedAddress, uint112 _rateLimitPerSecond, uint144 _bufferCap) external virtual override onlyGovernorOrAdmin {
        require(_bufferCap <= bufferCap, "MultiRateLimited: buffercap too high");

        uint112 oldRateLimitPerSecond = _rateLimitPerSecond;

        RateLimitData storage rateLimitData = rateLimitPerAddress[rateLimitedAddress];

        rateLimitData.lastBufferUsedTime = _blockTimestamp();
        rateLimitData.bufferCap = _bufferCap;
        rateLimitData.rateLimitPerSecond = _rateLimitPerSecond;
        rateLimitData.bufferStored = _bufferCap;

        emit IndividualRateLimitPerSecondUpdate(rateLimitedAddress, oldRateLimitPerSecond, _rateLimitPerSecond);
    }

    /// @notice remove an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the address to remove from the whitelist of addresses
    function removeAddress(address rateLimitedAddress) external virtual override isGovernorOrGuardianOrAdmin {
        uint256 oldRateLimitPerSecond = rateLimitPerAddress[rateLimitedAddress].rateLimitPerSecond;

        delete rateLimitPerAddress[rateLimitedAddress];

        emit IndividualRateLimitPerSecondUpdate(rateLimitedAddress, oldRateLimitPerSecond, 0);
    }

    /// @notice set the rate limit per second
    /// @param rateLimitedAddress the address whose buffer will be set
    /// @param newRateLimitPerSecond the new rate limit per second for this rateLimitedAddress
    function setIndividualRateLimitPerSecond(address rateLimitedAddress, uint112 newRateLimitPerSecond) external virtual override onlyGovernorOrAdmin {
        require(newRateLimitPerSecond <= rateLimitPerSecond, "MultiRateLimited: rateLimitPerSecond too high");

        _updateIndividualBufferStored(rateLimitedAddress);
        _setIndividualRateLimitPerSecond(rateLimitedAddress, newRateLimitPerSecond);
    }

    /// @notice set the buffer cap
    /// @param rateLimitedAddress the address whose buffer will be set
    /// @param newBufferCap the new buffer cap for this rateLimitedAddress
    function setIndividualBufferCap(address rateLimitedAddress, uint144 newBufferCap) external virtual override onlyGovernorOrAdmin {
        require(newBufferCap <= bufferCap, "MultiRateLimited: new buffer cap is over global max");

        _setIndividualBufferCap(rateLimitedAddress, newBufferCap);
    }

    /// @notice the amount of action used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    /// @param rateLimitedAddress the address whose buffer will be returned
    function individualBuffer(address rateLimitedAddress) public view override returns(uint144) {
        RateLimitData memory rateLimitData = rateLimitPerAddress[rateLimitedAddress];

        uint256 elapsed = block.timestamp - rateLimitData.lastBufferUsedTime;
        return uint144(Math.min(rateLimitData.bufferStored + (rateLimitData.rateLimitPerSecond * elapsed), rateLimitData.bufferCap));
    }

    /// @notice the rate per second for each address
    function individualRateLimitPerSecond(address limiter) external override view returns(uint256) {
        return rateLimitPerAddress[limiter].rateLimitPerSecond;
    }

    /// @notice the last time the buffer was used by each address
    function individualLastBufferUsedTime(address limiter) external override view returns(uint256) {
        return rateLimitPerAddress[limiter].lastBufferUsedTime;
    }

    /// @notice the cap of the buffer that can be used at once
    function individualBufferCap(address limiter) external override view returns(uint256) {
        return rateLimitPerAddress[limiter].bufferCap;
    }

    /// @notice the method that enforces the rate limit. Decreases buffer by "amount". 
    /// If buffer is <= amount either
    /// 1. Does a partial depletion by the amount remaining in the buffer or
    /// 2. Reverts
    /// Depending on whether doPartialAction is true or false
    /// @param rateLimitedAddress the address whose buffer will be depleted
    /// @param amount the amount to remove from the rateLimitedAddress's buffer
    function _depleteBuffer(address rateLimitedAddress, uint256 amount) internal returns(uint256) {
        _depleteBuffer(amount);

        uint256 newBuffer = individualBuffer(rateLimitedAddress);
        
        uint256 usedAmount = amount;
        if (doPartialAction && usedAmount > newBuffer) {
            usedAmount = newBuffer;
        }

        require(newBuffer != 0, "MultiRateLimited: no rate limit buffer");
        require(usedAmount <= newBuffer, "MultiRateLimited: rate limit hit");

        rateLimitPerAddress[rateLimitedAddress].bufferStored = uint144(newBuffer - usedAmount);

        rateLimitPerAddress[rateLimitedAddress].lastBufferUsedTime = _blockTimestamp();

        emit IndividualBufferUsed(rateLimitedAddress, usedAmount, newBuffer - usedAmount);

        return usedAmount;
    }

    /// @notice return current block timestamp as a uint32
    function _blockTimestamp() private view returns (uint32) {
        return block.timestamp.toUint32();
    }

    /// @notice set a new rate limit per second for a given rateLimitedAddress
    /// @param rateLimitedAddress the target address
    /// @param newRateLimitPerSecond the new rate limit for the given rateLimitedAddress
    function _setIndividualRateLimitPerSecond(address rateLimitedAddress, uint112 newRateLimitPerSecond) internal {
        uint256 oldRateLimitPerSecond = rateLimitPerAddress[rateLimitedAddress].rateLimitPerSecond;
        rateLimitPerAddress[rateLimitedAddress].rateLimitPerSecond = newRateLimitPerSecond;

        emit IndividualRateLimitPerSecondUpdate(rateLimitedAddress, oldRateLimitPerSecond, newRateLimitPerSecond);
    }

    /// @notice helper function to set the buffer cap of rateLimitedAddress to new buffer cap
    /// @param rateLimitedAddress the address to update buffer cap
    /// @param newBufferCap the new buffer cap for the given address
    function _setIndividualBufferCap(address rateLimitedAddress, uint144 newBufferCap) internal {
        RateLimitData storage rateLimitData = rateLimitPerAddress[rateLimitedAddress];

        uint256 oldBufferCap = rateLimitData.bufferCap;

        rateLimitData.bufferCap = newBufferCap;
        rateLimitData.bufferStored = newBufferCap;
        rateLimitData.lastBufferUsedTime = _blockTimestamp();

        emit IndividualBufferCapUpdate(rateLimitedAddress, oldBufferCap, newBufferCap);
    }

    /// @param rateLimitedAddress the address to reset buffer cap
    function _resetIndividualBuffer(address rateLimitedAddress) private {
        rateLimitPerAddress[rateLimitedAddress].bufferStored = rateLimitPerAddress[rateLimitedAddress].bufferCap;
    }

    /// @param rateLimitedAddress the address to update the buffer cap
    function _updateIndividualBufferStored(address rateLimitedAddress) private {
        RateLimitData storage rateLimitData = rateLimitPerAddress[rateLimitedAddress];

        rateLimitData.bufferStored = individualBuffer(rateLimitedAddress);
        rateLimitData.lastBufferUsedTime = _blockTimestamp();
    }
}
