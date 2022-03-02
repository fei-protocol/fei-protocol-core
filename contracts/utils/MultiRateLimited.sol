// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {CoreRef} from "../refs/CoreRef.sol";
import {TribeRoles} from "./../core/TribeRoles.sol";
import {RateLimited} from "./RateLimited.sol";
import {IMultiRateLimited} from "./IMultiRateLimited.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";

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
    mapping(address => RateLimitData) public rateLimitPerAddress;

    /// @notice max rate limit per second allowable by non governor per contract
    uint256 public individualMaxRateLimitPerSecond;

    /// @notice max buffer cap allowable by non governor per contract
    uint256 public individualMaxBufferCap;

    /// @param coreAddress address of the core contract
    /// @param _maxRateLimitPerSecond maximum amount of fei that can replenish per second ever, this amount cannot be changed by governance
    /// @param _rateLimitPerSecond maximum rate limit per second per address
    /// @param _individualMaxRateLimitPerSecond maximum rate limit per second per address in multi rate limited
    /// @param _individualMaxBufferCap maximum buffer cap in multi rate limited
    /// @param _globalBufferCap maximum global buffer cap
    constructor(
        address coreAddress,
        uint256 _maxRateLimitPerSecond,
        uint256 _rateLimitPerSecond,
        uint256 _individualMaxRateLimitPerSecond,
        uint256 _individualMaxBufferCap,
        uint256 _globalBufferCap
    )
        CoreRef(coreAddress)
        RateLimited(
            _maxRateLimitPerSecond,
            _rateLimitPerSecond,
            _globalBufferCap,
            false
        )
    {
        require(
            _individualMaxBufferCap < _globalBufferCap,
            "MultiRateLimited: max buffer cap invalid"
        );

        individualMaxRateLimitPerSecond = _individualMaxRateLimitPerSecond;
        individualMaxBufferCap = _individualMaxBufferCap;
    }

    // ----------- Governor and Admin only state changing api -----------

    /// @notice update the ADD_MINTER_ROLE rate limit per second
    /// @param newRateLimitPerSecond new maximum rate limit per second for add minter role
    function updateMaxRateLimitPerSecond(uint256 newRateLimitPerSecond)
        external
        virtual
        override
        onlyGovernor
    {
        require(
            newRateLimitPerSecond <= MAX_RATE_LIMIT_PER_SECOND,
            "MultiRateLimited: exceeds global max rate limit per second"
        );

        uint256 oldMaxRateLimitPerSecond = individualMaxRateLimitPerSecond;
        individualMaxRateLimitPerSecond = newRateLimitPerSecond;

        emit MultiMaxRateLimitPerSecondUpdate(
            oldMaxRateLimitPerSecond,
            newRateLimitPerSecond
        );
    }

    /// @notice update the ADD_MINTER_ROLE max buffer cap
    /// @param newBufferCap new buffer cap for ADD_MINTER_ROLE added addresses
    function updateMaxBufferCap(uint256 newBufferCap)
        external
        virtual
        override
        onlyGovernor
    {
        require(
            newBufferCap <= bufferCap,
            "MultiRateLimited: exceeds global buffer cap"
        );

        uint256 oldBufferCap = individualMaxBufferCap;
        individualMaxBufferCap = newBufferCap;

        emit MultiBufferCapUpdate(oldBufferCap, newBufferCap);
    }

    /// @notice add an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the new address to add as a rateLimitedAddress
    /// @param _rateLimitPerSecond the rate limit per second for this rateLimitedAddress
    /// @param _bufferCap  the buffer cap for this rateLimitedAddress
    function addAddress(
        address rateLimitedAddress,
        uint112 _rateLimitPerSecond,
        uint144 _bufferCap
    ) external virtual override onlyGovernor {
        _addAddress(rateLimitedAddress, _rateLimitPerSecond, _bufferCap);
    }

    /// @notice add an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the address whose buffer and rate limit per second will be set
    /// @param _rateLimitPerSecond the new rate limit per second for this rateLimitedAddress
    /// @param _bufferCap  the new buffer cap for this rateLimitedAddress
    function updateAddress(
        address rateLimitedAddress,
        uint112 _rateLimitPerSecond,
        uint144 _bufferCap
    )
        external
        virtual
        override
        hasAnyOfTwoRoles(TribeRoles.ADD_MINTER_ROLE, TribeRoles.GOVERNOR)
    {
        if (core().hasRole(TribeRoles.ADD_MINTER_ROLE, msg.sender)) {
            require(
                _rateLimitPerSecond <= individualMaxRateLimitPerSecond,
                "MultiRateLimited: rate limit per second exceeds non governor allowable amount"
            );
            require(
                _bufferCap <= individualMaxBufferCap,
                "MultiRateLimited: max buffer cap exceeds non governor allowable amount"
            );
        }
        require(
            _bufferCap <= bufferCap,
            "MultiRateLimited: buffercap too high"
        );

        _updateAddress(rateLimitedAddress, _rateLimitPerSecond, _bufferCap);
    }

    /// @notice add an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the new address to add as a rateLimitedAddress
    /// gives the newly added contract the maximum allowable rate limit per second and buffer cap
    function addAddressWithCaps(address rateLimitedAddress)
        external
        virtual
        override
        onlyTribeRole(TribeRoles.ADD_MINTER_ROLE)
    {
        _addAddress(
            rateLimitedAddress,
            uint112(individualMaxRateLimitPerSecond),
            uint144(individualMaxBufferCap)
        );
    }

    /// @notice remove an authorized rateLimitedAddress contract
    /// @param rateLimitedAddress the address to remove from the whitelist of addresses
    function removeAddress(address rateLimitedAddress)
        external
        virtual
        override
        onlyGuardianOrGovernor
    {
        uint256 oldRateLimitPerSecond = rateLimitPerAddress[rateLimitedAddress]
            .rateLimitPerSecond;

        delete rateLimitPerAddress[rateLimitedAddress];

        emit IndividualRateLimitPerSecondUpdate(
            rateLimitedAddress,
            oldRateLimitPerSecond,
            0
        );
    }

    /// @notice set the rate limit per second
    /// @param rateLimitedAddress the address whose buffer will be set
    /// @param newRateLimitPerSecond the new rate limit per second for this rateLimitedAddress
    function setIndividualRateLimitPerSecond(
        address rateLimitedAddress,
        uint112 newRateLimitPerSecond
    ) external virtual override onlyGovernor {
        require(
            newRateLimitPerSecond <= rateLimitPerSecond,
            "MultiRateLimited: rateLimitPerSecond too high"
        );

        _updateIndividualBufferStored(rateLimitedAddress);
        _setIndividualRateLimitPerSecond(
            rateLimitedAddress,
            newRateLimitPerSecond
        );
    }

    /// @notice set the buffer cap
    /// @param rateLimitedAddress the address whose buffer will be set
    /// @param newBufferCap the new buffer cap for this rateLimitedAddress
    function setIndividualBufferCap(
        address rateLimitedAddress,
        uint144 newBufferCap
    ) external virtual override onlyGovernor {
        require(
            newBufferCap <= bufferCap,
            "MultiRateLimited: new buffer cap is over global max"
        );

        _setIndividualBufferCap(rateLimitedAddress, newBufferCap);
    }

    // ----------- Getters -----------

    /// @notice the amount of action used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    /// @param rateLimitedAddress the address whose buffer will be returned
    /// @return the buffer of the specified rate limited address
    function individualBuffer(address rateLimitedAddress)
        public
        view
        override
        returns (uint144)
    {
        RateLimitData memory rateLimitData = rateLimitPerAddress[
            rateLimitedAddress
        ];

        uint256 elapsed = block.timestamp - rateLimitData.lastBufferUsedTime;
        return
            uint144(
                Math.min(
                    rateLimitData.bufferStored +
                        (rateLimitData.rateLimitPerSecond * elapsed),
                    rateLimitData.bufferCap
                )
            );
    }

    /// @notice the rate per second for each address
    function getRateLimitPerSecond(address limiter)
        external
        view
        override
        returns (uint256)
    {
        return rateLimitPerAddress[limiter].rateLimitPerSecond;
    }

    /// @notice the last time the buffer was used by each address
    function getLastBufferUsedTime(address limiter)
        external
        view
        override
        returns (uint256)
    {
        return rateLimitPerAddress[limiter].lastBufferUsedTime;
    }

    /// @notice the cap of the buffer that can be used at once
    function getBufferCap(address limiter)
        external
        view
        override
        returns (uint256)
    {
        return rateLimitPerAddress[limiter].bufferCap;
    }

    // ----------- Helper Methods -----------

    function _updateAddress(
        address rateLimitedAddress,
        uint112 _rateLimitPerSecond,
        uint144 _bufferCap
    ) internal {
        uint112 oldRateLimitPerSecond = _rateLimitPerSecond;

        RateLimitData storage rateLimitData = rateLimitPerAddress[
            rateLimitedAddress
        ];

        require(
            rateLimitData.lastBufferUsedTime != 0,
            "MultiRateLimited: rate limit address does not exist"
        );
        require(
            _rateLimitPerSecond <= MAX_RATE_LIMIT_PER_SECOND,
            "MultiRateLimited: rateLimitPerSecond too high"
        );

        rateLimitData.lastBufferUsedTime = block.timestamp.toUint32();
        rateLimitData.bufferCap = _bufferCap;
        rateLimitData.rateLimitPerSecond = _rateLimitPerSecond;
        rateLimitData.bufferStored = _bufferCap;

        emit IndividualRateLimitPerSecondUpdate(
            rateLimitedAddress,
            oldRateLimitPerSecond,
            _rateLimitPerSecond
        );
    }

    /// @param rateLimitedAddress the new address to add as a rateLimitedAddress
    /// @param _rateLimitPerSecond the rate limit per second for this rateLimitedAddress
    /// @param _bufferCap  the buffer cap for this rateLimitedAddress
    function _addAddress(
        address rateLimitedAddress,
        uint112 _rateLimitPerSecond,
        uint144 _bufferCap
    ) internal {
        require(
            _bufferCap <= bufferCap,
            "MultiRateLimited: new buffercap too high"
        );
        require(
            rateLimitPerAddress[rateLimitedAddress].lastBufferUsedTime == 0,
            "MultiRateLimited: address already added"
        );
        require(
            _rateLimitPerSecond <= MAX_RATE_LIMIT_PER_SECOND,
            "MultiRateLimited: rateLimitPerSecond too high"
        );

        RateLimitData memory rateLimitData = RateLimitData({
            lastBufferUsedTime: block.timestamp.toUint32(),
            bufferCap: _bufferCap,
            rateLimitPerSecond: _rateLimitPerSecond,
            bufferStored: _bufferCap
        });

        rateLimitPerAddress[rateLimitedAddress] = rateLimitData;

        emit IndividualRateLimitPerSecondUpdate(
            rateLimitedAddress,
            0,
            _rateLimitPerSecond
        );
    }

    /// @notice the method that enforces the rate limit. Decreases buffer by "amount".
    /// @param rateLimitedAddress the address whose buffer will be depleted
    /// @param amount the amount to remove from the rateLimitedAddress's buffer
    function _depleteBuffer(address rateLimitedAddress, uint256 amount)
        internal
        returns (uint256)
    {
        _depleteBuffer(amount);

        uint256 newBuffer = individualBuffer(rateLimitedAddress);

        require(newBuffer != 0, "MultiRateLimited: no rate limit buffer");
        require(amount <= newBuffer, "MultiRateLimited: rate limit hit");

        rateLimitPerAddress[rateLimitedAddress].bufferStored = uint144(
            newBuffer - amount
        );

        rateLimitPerAddress[rateLimitedAddress].lastBufferUsedTime = block
            .timestamp
            .toUint32();

        emit IndividualBufferUsed(
            rateLimitedAddress,
            amount,
            newBuffer - amount
        );

        return amount;
    }

    /// @notice set a new rate limit per second for a given rateLimitedAddress
    /// @param rateLimitedAddress the target address
    /// @param newRateLimitPerSecond the new rate limit for the given rateLimitedAddress
    function _setIndividualRateLimitPerSecond(
        address rateLimitedAddress,
        uint112 newRateLimitPerSecond
    ) internal {
        uint256 oldRateLimitPerSecond = rateLimitPerAddress[rateLimitedAddress]
            .rateLimitPerSecond;
        rateLimitPerAddress[rateLimitedAddress]
            .rateLimitPerSecond = newRateLimitPerSecond;

        emit IndividualRateLimitPerSecondUpdate(
            rateLimitedAddress,
            oldRateLimitPerSecond,
            newRateLimitPerSecond
        );
    }

    /// @notice helper function to set the buffer cap of rateLimitedAddress to new buffer cap
    /// @param rateLimitedAddress the address to update buffer cap
    /// @param newBufferCap the new buffer cap for the given address
    function _setIndividualBufferCap(
        address rateLimitedAddress,
        uint144 newBufferCap
    ) internal {
        RateLimitData storage rateLimitData = rateLimitPerAddress[
            rateLimitedAddress
        ];

        uint256 oldBufferCap = rateLimitData.bufferCap;

        rateLimitData.bufferCap = newBufferCap;
        rateLimitData.bufferStored = newBufferCap;
        rateLimitData.lastBufferUsedTime = block.timestamp.toUint32();

        emit IndividualBufferCapUpdate(
            rateLimitedAddress,
            oldBufferCap,
            newBufferCap
        );
    }

    /// @param rateLimitedAddress the address to reset buffer cap
    function _resetIndividualBuffer(address rateLimitedAddress) internal {
        rateLimitPerAddress[rateLimitedAddress]
            .bufferStored = rateLimitPerAddress[rateLimitedAddress].bufferCap;
    }

    /// @param rateLimitedAddress the address to update the buffer cap
    function _updateIndividualBufferStored(address rateLimitedAddress)
        internal
    {
        RateLimitData storage rateLimitData = rateLimitPerAddress[
            rateLimitedAddress
        ];

        rateLimitData.bufferStored = individualBuffer(rateLimitedAddress);
        rateLimitData.lastBufferUsedTime = block.timestamp.toUint32();
    }
}
