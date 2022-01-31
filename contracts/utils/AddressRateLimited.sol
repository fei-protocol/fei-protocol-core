// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title abstract contract for putting a rate limit on how fast a contract can perform an action e.g. Minting
/// @author Fei Protocol
abstract contract AddressRateLimited is CoreRef {

    /// @notice maximum rate limit per second governance can set for this contract
    uint256 public immutable MAX_RATE_LIMIT_PER_SECOND_PER_ADDRESS;

    /// @notice maximum rate limit per second governance can set for this contract
    uint256 public immutable MAX_BUFFER_CAP;

    /// @notice the rate per second for each minter
    mapping (address => uint256) public rateLimitPerSecond;

    /// @notice the last time the buffer was used by each minter
    mapping (address => uint256) public lastBufferUsedTime;

    /// @notice the cap of the buffer that can be used at once
    mapping (address => uint256) public bufferCap;

    /// @notice a flag for whether to allow partial actions to complete if the buffer is less than amount
    bool public doPartialAction;

    /// @notice the buffer at the timestamp of lastBufferUsedTime
    mapping (address => uint256) private _bufferStored;

    // ----------- Events -----------
    
    /// @notice emitted when a buffer is eaten into
    event BufferUsed(address minter, uint256 amountUsed, uint256 bufferRemaining);
    
    /// @notice emitted when a buffer cap is updated
    event BufferCapUpdate(address minter, uint256 oldBufferCap, uint256 newBufferCap);
    
    /// @notice emitted when rate limit is updated
    event RateLimitPerSecondUpdate(address minter, uint256 oldRateLimitPerSecond, uint256 newRateLimitPerSecond);

    constructor(uint256 _maxRateLimitPerSecond, uint256 maxBufferCap, bool _doPartialAction) {
        MAX_BUFFER_CAP = maxBufferCap;
        MAX_RATE_LIMIT_PER_SECOND_PER_ADDRESS = _maxRateLimitPerSecond;
        doPartialAction = _doPartialAction;
    }

    /// @notice mint fei to the target address and deplete the buffer
    function _mintFei(address to, uint256 amount) internal virtual override(CoreRef) {
        _depleteBuffer(msg.sender, amount);
        super._mintFei(to, amount);
    }

    /// @notice add an authorized minter contract
    /// @param _minter the new address to add as a minter
    /// @param _rateLimitPerSecond the rate limit per second for this minter
    /// @param _bufferCap  the buffer cap for this minter
    function addMinter(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) public virtual onlyGovernorOrAdmin {
        require(_rateLimitPerSecond <= MAX_RATE_LIMIT_PER_SECOND_PER_ADDRESS, "AddressRateLimited: new rateLimitPerSecond too high");
        require(_bufferCap <= MAX_BUFFER_CAP, "AddressRateLimited: new buffercap too high");

        rateLimitPerSecond[_minter] = _rateLimitPerSecond;
        lastBufferUsedTime[_minter] = block.timestamp;
        bufferCap[_minter] = _bufferCap;
        _bufferStored[_minter] = _bufferCap;

        emit RateLimitPerSecondUpdate(_minter, 0, _rateLimitPerSecond);
    }

    /// @notice add an authorized minter contract
    /// @param _minter the address whose buffer and rate limit per second will be set
    /// @param _rateLimitPerSecond the new rate limit per second for this minter
    /// @param _bufferCap  the new buffer cap for this minter
    function updateMinter(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) public virtual onlyGovernorOrAdmin {
        require(_rateLimitPerSecond <= MAX_RATE_LIMIT_PER_SECOND_PER_ADDRESS, "AddressRateLimited: rateLimitPerSecond too high");
        require(_bufferCap <= MAX_BUFFER_CAP, "AddressRateLimited: buffercap too high");

        rateLimitPerSecond[_minter] = _rateLimitPerSecond;
        lastBufferUsedTime[_minter] = block.timestamp;
        bufferCap[_minter] = _bufferCap;
        _bufferStored[_minter] = _bufferCap;

        emit RateLimitPerSecondUpdate(_minter, 0, _rateLimitPerSecond);
    }

    /// @notice remove an authorized minter contract
    /// @param _minter the address to remove from the whitelist of minters
    function removeMinter(address _minter) public virtual isGovernorOrGuardianOrAdmin {
        uint256 oldRateLimitPerSecond = rateLimitPerSecond[_minter];

        delete rateLimitPerSecond[_minter];
        delete _bufferStored[_minter];
        delete bufferCap[_minter];

        lastBufferUsedTime[_minter] = block.timestamp;

        emit RateLimitPerSecondUpdate(_minter, oldRateLimitPerSecond, 0);
    }

    /// @notice set the rate limit per second
    /// @param minter the address whose buffer will be set
    /// @param newRateLimitPerSecond the new rate limit per second for this minter
    function setRateLimitPerSecond(address minter, uint256 newRateLimitPerSecond) public virtual onlyGovernorOrAdmin {
        require(newRateLimitPerSecond <= MAX_RATE_LIMIT_PER_SECOND_PER_ADDRESS, "AddressRateLimited: rateLimitPerSecond too high");
        _updateBufferStored(minter);
        
        _setRateLimitPerSecond(minter, newRateLimitPerSecond);
    }

    /// @notice set the buffer cap
    /// @param minter the address whose buffer will be set
    /// @param newBufferCap the new buffer cap for this minter
    function setBufferCap(address minter, uint256 newBufferCap) external virtual onlyGovernorOrAdmin {
        _setBufferCap(minter, newBufferCap);
    }

    /// @notice the amount of action used before hitting limit
    /// @dev replenishes at rateLimitPerSecond per second up to bufferCap
    /// @param minter the address whose buffer will be returned
    function buffer(address minter) public view returns(uint256) { 
        uint256 elapsed = block.timestamp - lastBufferUsedTime[minter];
        return Math.min(_bufferStored[minter] + (rateLimitPerSecond[minter] * elapsed), bufferCap[minter]);
    }

    /// @notice the method that enforces the rate limit. Decreases buffer by "amount". 
    /// If buffer is <= amount either
    /// 1. Does a partial mint by the amount remaining in the buffer or
    /// 2. Reverts
    /// Depending on whether doPartialAction is true or false
    /// @param minter the address whose buffer will be depleted
    /// @param amount the amount to remove from the minter's buffer
    function _depleteBuffer(address minter, uint256 amount) internal returns(uint256) {
        uint256 newBuffer = buffer(minter);
        
        uint256 usedAmount = amount;
        if (doPartialAction && usedAmount > newBuffer) {
            usedAmount = newBuffer;
        }

        require(newBuffer != 0, "AddressRateLimited: no rate limit buffer");
        require(usedAmount <= newBuffer, "AddressRateLimited: rate limit hit");

        _bufferStored[minter] = newBuffer - usedAmount;

        lastBufferUsedTime[minter] = block.timestamp;

        emit BufferUsed(minter, usedAmount, _bufferStored[minter]);

        return usedAmount;
    }

    /// @notice set a new rate limit per second for a given minter
    /// @param minter the target address
    /// @param newRateLimitPerSecond the new rate limit for the given minter
    function _setRateLimitPerSecond(address minter, uint256 newRateLimitPerSecond) internal {
        uint256 oldRateLimitPerSecond = rateLimitPerSecond[minter];
        rateLimitPerSecond[minter] = newRateLimitPerSecond;

        emit RateLimitPerSecondUpdate(minter, oldRateLimitPerSecond, newRateLimitPerSecond);
    }

    /// @notice helper function to set the buffer cap of minter to new buffer cap
    /// @param minter the address to update buffer cap
    /// @param newBufferCap the new buffer cap for the given address
    function _setBufferCap(address minter, uint256 newBufferCap) internal {
        uint256 oldBufferCap = bufferCap[minter];
        bufferCap[minter] = newBufferCap;
        _bufferStored[minter] = newBufferCap;
        lastBufferUsedTime[minter] = block.timestamp;

        emit BufferCapUpdate(minter, oldBufferCap, newBufferCap);
    }

    /// @param minter the address to reset buffer cap
    function _resetBuffer(address minter) internal {
        _bufferStored[minter] = bufferCap[minter];
    }

    /// @param minter the address to update the buffer cap
    function _updateBufferStored(address minter) internal {
        _bufferStored[minter] = buffer(minter);
        lastBufferUsedTime[minter] = block.timestamp;
    }
}
