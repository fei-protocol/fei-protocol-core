// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "./RateLimited.sol";
import "./IMultiRateLimited.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title contract for putting a rate limit on how fast an address can perform an action e.g. Minting
/// there are two buffers, one buffer which is each individual addresses's current buffer,
/// and then there is a global buffer which is the buffer that each individual address must respect as well
/// @author Fei Protocol
contract MultiRateLimited is RateLimited, IMultiRateLimited {

    /// @notice the rate per second for each address
    mapping (address => uint256) public individualRateLimitPerSecond;

    /// @notice the last time the buffer was used by each address 
    mapping (address => uint256) public individualLastBufferUsedTime;

    /// @notice the cap of the buffer that can be used at once by a single address
    mapping (address => uint256) public individualBufferCap;

    /// @notice the buffer at the timestamp of lastBufferUsedTime
    mapping (address => uint256) private _bufferStored;

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

    /// @notice add an authorized minter contract
    /// @param _minter the new address to add as a minter
    /// @param _rateLimitPerSecond the rate limit per second for this minter
    /// @param _bufferCap  the buffer cap for this minter
    function addAddress(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) external virtual override onlyGovernorOrAdmin {
        require(_bufferCap <= bufferCap, "MultiRateLimited: new buffercap too high");

        individualRateLimitPerSecond[_minter] = _rateLimitPerSecond;
        individualLastBufferUsedTime[_minter] = block.timestamp;
        individualBufferCap[_minter] = _bufferCap;
        _bufferStored[_minter] = _bufferCap;

        emit IndividualRateLimitPerSecondUpdate(_minter, 0, _rateLimitPerSecond);
    }

    /// @notice add an authorized minter contract
    /// @param _minter the address whose buffer and rate limit per second will be set
    /// @param _rateLimitPerSecond the new rate limit per second for this minter
    /// @param _bufferCap  the new buffer cap for this minter
    function updateAddress(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) external virtual override onlyGovernorOrAdmin {
        require(_bufferCap <= bufferCap, "MultiRateLimited: buffercap too high");

        individualRateLimitPerSecond[_minter] = _rateLimitPerSecond;
        individualLastBufferUsedTime[_minter] = block.timestamp;
        individualBufferCap[_minter] = _bufferCap;
        _bufferStored[_minter] = _bufferCap;

        emit IndividualRateLimitPerSecondUpdate(_minter, 0, _rateLimitPerSecond);
    }

    /// @notice remove an authorized minter contract
    /// @param _minter the address to remove from the whitelist of addresses
    function removeAddress(address _minter) external virtual override isGovernorOrGuardianOrAdmin {
        uint256 oldRateLimitPerSecond = individualRateLimitPerSecond[_minter];

        delete individualRateLimitPerSecond[_minter];
        delete _bufferStored[_minter];
        delete individualBufferCap[_minter];
        individualLastBufferUsedTime[_minter] = block.timestamp;

        emit IndividualRateLimitPerSecondUpdate(_minter, oldRateLimitPerSecond, 0);
    }

    /// @notice set the rate limit per second
    /// @param minter the address whose buffer will be set
    /// @param newRateLimitPerSecond the new rate limit per second for this minter
    function setIndividualRateLimitPerSecond(address minter, uint256 newRateLimitPerSecond) external virtual override onlyGovernorOrAdmin {
        require(newRateLimitPerSecond <= rateLimitPerSecond, "MultiRateLimited: rateLimitPerSecond too high");

        _updateIndividualBufferStored(minter);
        _setIndividualRateLimitPerSecond(minter, newRateLimitPerSecond);
    }

    /// @notice set the buffer cap
    /// @param minter the address whose buffer will be set
    /// @param newBufferCap the new buffer cap for this minter
    function setIndividualBufferCap(address minter, uint256 newBufferCap) external virtual override onlyGovernorOrAdmin {
        require(newBufferCap <= bufferCap, "MultiRateLimited: new buffer cap is over global max");

        _setIndividualBufferCap(minter, newBufferCap);
    }

    /// @notice the amount of action used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    /// @param minter the address whose buffer will be returned
    function buffer(address minter) public view override returns(uint256) { 
        uint256 elapsed = block.timestamp - individualLastBufferUsedTime[minter];
        return Math.min(_bufferStored[minter] + (individualRateLimitPerSecond[minter] * elapsed), individualBufferCap[minter]);
    }

    /// @notice the method that enforces the rate limit. Decreases buffer by "amount". 
    /// If buffer is <= amount either
    /// 1. Does a partial mint by the amount remaining in the buffer or
    /// 2. Reverts
    /// Depending on whether doPartialAction is true or false
    /// @param minter the address whose buffer will be depleted
    /// @param amount the amount to remove from the minter's buffer
    function _depleteBuffer(address minter, uint256 amount) internal returns(uint256) {
        _depleteBuffer(amount);

        uint256 newBuffer = buffer(minter);
        
        uint256 usedAmount = amount;
        if (doPartialAction && usedAmount > newBuffer) {
            usedAmount = newBuffer;
        }

        require(newBuffer != 0, "MultiRateLimited: no rate limit buffer");
        require(usedAmount <= newBuffer, "MultiRateLimited: rate limit hit");

        _bufferStored[minter] = newBuffer - usedAmount;

        individualLastBufferUsedTime[minter] = block.timestamp;

        emit IndividualBufferUsed(minter, usedAmount, _bufferStored[minter]);

        return usedAmount;
    }

    /// @notice set a new rate limit per second for a given minter
    /// @param minter the target address
    /// @param newRateLimitPerSecond the new rate limit for the given minter
    function _setIndividualRateLimitPerSecond(address minter, uint256 newRateLimitPerSecond) internal {
        uint256 oldRateLimitPerSecond = individualRateLimitPerSecond[minter];
        individualRateLimitPerSecond[minter] = newRateLimitPerSecond;

        emit IndividualRateLimitPerSecondUpdate(minter, oldRateLimitPerSecond, newRateLimitPerSecond);
    }

    /// @notice helper function to set the buffer cap of minter to new buffer cap
    /// @param minter the address to update buffer cap
    /// @param newBufferCap the new buffer cap for the given address
    function _setIndividualBufferCap(address minter, uint256 newBufferCap) internal {
        uint256 oldBufferCap = individualBufferCap[minter];
        individualBufferCap[minter] = newBufferCap;
        _bufferStored[minter] = newBufferCap;
        individualLastBufferUsedTime[minter] = block.timestamp;

        emit IndividualBufferCapUpdate(minter, oldBufferCap, newBufferCap);
    }

    /// @param minter the address to reset buffer cap
    function _resetIndividualBuffer(address minter) private {
        _bufferStored[minter] = individualBufferCap[minter];
    }

    /// @param minter the address to update the buffer cap
    function _updateIndividualBufferStored(address minter) private {
        _bufferStored[minter] = buffer(minter);
        individualLastBufferUsedTime[minter] = block.timestamp;
    }
}
