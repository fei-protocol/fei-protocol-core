// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {CoreRef} from "../refs/CoreRef.sol";
import {TribeRoles} from "./../core/TribeRoles.sol";
import {RateLimitedV2} from "./RateLimitedV2.sol";
import {IMultiRateLimited} from "./IMultiRateLimited.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

/// @title abstract contract for putting a rate limit on how fast an address can perform an action e.g. Minting
/// there are two buffers, one buffer which is each individual addresses's current buffer,
/// and then there is a global buffer which is the buffer that each individual address must respect as well
/// @author Elliot Friedman, Fei Protocol
/// this contract was made abstract so that other contracts that already construct an instance of CoreRef
/// do not collide with this one
contract MultiRateLimited is RateLimitedV2, IMultiRateLimited {
    using SafeCast for *;

    /// @notice rate limit data for each address
    mapping(address => RateLimitData) public rateLimitData;

    /// @notice max rate limit per address
    uint112 public currentMaxIndividualRateLimit;

    /// @notice max buffer cap per address
    uint112 public currentMaxBufferCap;

    /// @param _globalMaxRateLimit maximum amount of fei that can replenish per second across all contracts; not changeable by governance
    /// @param _globalMaxBufferCap maximum global buffer cap
    /// @param _globalInitialRateLimit maximum rate limit per second per address
    /// @param _maxIndividualRateLimit maximum rate limit per second per address in multi rate limited
    /// @param _maxIndividualBufferCap maximum buffer cap in multi rate limited
    constructor(
        address core,
        uint112 _globalMaxRateLimit,
        uint112 _globalMaxBufferCap,
        uint112 _globalInitialRateLimit,
        uint112 _maxIndividualRateLimit,
        uint112 _maxIndividualBufferCap
    )
        RateLimitedV2(
            core,
            _globalMaxRateLimit,
            _globalInitialRateLimit,
            _globalMaxBufferCap
        )
    {
        if (_maxIndividualBufferCap >= _globalMaxBufferCap)
            revert InvalidMultiBufferCap();
        if (_maxIndividualRateLimit >= _globalMaxRateLimit)
            revert InvalidMultiRateLimit();

        currentMaxIndividualRateLimit = _maxIndividualRateLimit;
        currentMaxBufferCap = _maxIndividualBufferCap;
    }

    modifier isRateLimited(address anAddress) {
        if (rateLimitData[anAddress].bufferLastUpdate == 0)
            revert NotRateLimited(anAddress);

        _;
    }

    modifier isNotRateLimited(address anAddress) {
        if (rateLimitData[anAddress].bufferLastUpdate != 0)
            revert AlreadyRateLimited(anAddress);

        _;
    }

    // ----------- Getters -----------

    /// @notice the amount of action used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    /// @param rateLimitedAddress the address whose buffer will be returned
    /// @return the buffer of the specified rate limited address
    function getBuffer(address rateLimitedAddress)
        public
        view
        override
        returns (uint112)
    {
        uint256 elapsed = block.timestamp -
            rateLimitData[rateLimitedAddress].bufferLastUpdate;
        return
            uint112(
                Math.min(
                    rateLimitData[rateLimitedAddress].bufferStored +
                        (rateLimitData[rateLimitedAddress].rateLimit * elapsed),
                    rateLimitData[rateLimitedAddress].bufferCap
                )
            );
    }

    /// @notice the rate per second for each addressd
    function getRateLimit(address limited)
        external
        view
        override
        returns (uint112)
    {
        return rateLimitData[limited].rateLimit;
    }

    /// @notice the last time the buffer was used by each address
    function getBufferLastUpdate(address limited)
        external
        view
        override
        returns (uint32)
    {
        return rateLimitData[limited].bufferLastUpdate;
    }

    /// @notice the cap of the buffer that can be used at once
    function getBufferCap(address limited)
        external
        view
        override
        returns (uint112)
    {
        return rateLimitData[limited].bufferCap;
    }

    // ----------- Governor and Admin only state changing api -----------

    /// @notice update the per-address maximum rate limit
    /// @param newRateLimit new maximum rate limit
    function updateMaxRateLimit(uint112 newRateLimit)
        external
        override
        onlyGovernor
    {
        if (newRateLimit > currentMaxIndividualRateLimit)
            revert InvalidRateLimit();

        emit MultiMaxRateLimitPerSecondUpdate(
            currentMaxIndividualRateLimit,
            newRateLimit
        );

        currentMaxIndividualRateLimit = newRateLimit;
    }

    /// @notice update the per-address maximum buffer cap
    /// @param newBufferCap new buffer cap
    function updateMaxBufferCap(uint112 newBufferCap)
        external
        override
        onlyGovernor
    {
        if (newBufferCap > bufferCap) revert InvalidBufferCap();

        emit MultiBufferCapUpdate(currentMaxBufferCap, newBufferCap);

        currentMaxBufferCap = newBufferCap;
    }

    /// @notice add an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the address whose buffer and rate limit per second will be set
    /// @param newRateLimit the new rate limit per second for this rateLimitedAddress
    /// @param newBufferCap the new buffer cap for this rateLimitedAddress
    function updateAddress(
        address rateLimitedAddress,
        uint112 newRateLimit,
        uint112 newBufferCap
    )
        external
        override
        isRateLimited(rateLimitedAddress)
        hasAnyOfTwoRoles(TribeRoles.ADD_MINTER_ROLE, TribeRoles.GOVERNOR)
    {
        if (newRateLimit > currentMaxIndividualRateLimit)
            revert InvalidMultiRateLimit();
        if (newBufferCap > currentMaxBufferCap) revert InvalidMultiBufferCap();

        _updateAddress(rateLimitedAddress, newRateLimit, newBufferCap);
    }

    /// @notice adds an address to be rate limited
    /// @param rateLimitedAddress the new address to add
    function addAddress(
        address rateLimitedAddress,
        uint112 rateLimit,
        uint112 bufferCap
    )
        external
        override
        isNotRateLimited(rateLimitedAddress)
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.ADD_MINTER_ROLE)
    {
        if (rateLimit > currentMaxIndividualRateLimit)
            revert InvalidMultiRateLimit();
        if (bufferCap > currentMaxBufferCap) revert InvalidMultiBufferCap();

        _addAddress(rateLimitedAddress, rateLimit, bufferCap);
    }

    /// @notice remove an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the address to remove from the whitelist of addresses
    function removeAddress(address rateLimitedAddress)
        external
        override
        isRateLimited(rateLimitedAddress)
        onlyGuardianOrGovernor
    {
        emit IndividualRateLimitPerSecondUpdate(
            rateLimitedAddress,
            rateLimitData[rateLimitedAddress].rateLimit,
            0
        );
        delete rateLimitData[rateLimitedAddress];
    }

    // ----------- Helper Methods -----------

    function _updateAddress(
        address rateLimitedAddress,
        uint112 newRateLimit,
        uint112 newBufferCap
    ) internal {
        emit IndividualRateLimitPerSecondUpdate(
            rateLimitedAddress,
            rateLimitData[rateLimitedAddress].rateLimit,
            newRateLimit
        );

        // We update the buffer cap *first* otherwise we may set the buffer too high
        uint32 thisBufferLastUpdate = block.timestamp.toUint32();
        rateLimitData[rateLimitedAddress].bufferCap = newBufferCap;
        rateLimitData[rateLimitedAddress].bufferStored = getBuffer(
            rateLimitedAddress
        );
        rateLimitData[rateLimitedAddress]
            .bufferLastUpdate = thisBufferLastUpdate;
        rateLimitData[rateLimitedAddress].rateLimit = newRateLimit;
    }

    /// @param rateLimitedAddress the new address to add as a rateLimitedAddress
    /// @param rateLimit the rate limit per second for this rateLimitedAddress
    /// @param bufferCap the buffer cap for this rateLimitedAddress
    function _addAddress(
        address rateLimitedAddress,
        uint112 rateLimit,
        uint112 bufferCap
    ) internal {
        uint32 thisbufferLastUpdate = block.timestamp.toUint32();
        rateLimitData[rateLimitedAddress].rateLimit = rateLimit;
        rateLimitData[rateLimitedAddress].bufferCap = bufferCap;
        rateLimitData[rateLimitedAddress].bufferStored = 0;
        rateLimitData[rateLimitedAddress]
            .bufferLastUpdate = thisbufferLastUpdate;
        emit IndividualRateLimitPerSecondUpdate(
            rateLimitedAddress,
            0,
            rateLimit
        );
    }

    /// @notice the method that enforces the rate limit. Decreases global & individual buffers by "amount".
    /// @param rateLimitedAddress the address whose buffer will be depleted
    /// @param amountToDeplete the amount to remove from the rateLimitedAddress's buffer
    function _depleteIndividualBuffer(
        address rateLimitedAddress,
        uint256 amountToDeplete
    ) internal {
        // Deplete the global buffer first
        _depleteBuffer(amountToDeplete);

        uint256 currentBuffer = getBuffer(rateLimitedAddress);

        if (amountToDeplete > currentBuffer) revert MultiRateLimitExceeded();

        uint32 thisBufferLastUpdate = block.timestamp.toUint32();
        uint112 newBufferStored = uint112(currentBuffer - amountToDeplete);
        rateLimitData[rateLimitedAddress]
            .bufferLastUpdate = thisBufferLastUpdate;
        rateLimitData[rateLimitedAddress].bufferCap = rateLimitData[
            rateLimitedAddress
        ].bufferCap;
        rateLimitData[rateLimitedAddress].bufferStored = newBufferStored;

        emit IndividualBufferUsed(
            rateLimitedAddress,
            amountToDeplete,
            currentBuffer - amountToDeplete
        );
    }
}
