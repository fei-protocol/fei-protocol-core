// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title abstract contract for putting a rate limit on how fast a contract can mint FEI
/// @author Fei Protocol
abstract contract RateLimitedMinter is CoreRef {

    /// @notice maximum amount of FEI per second governance can set for this contract
    uint256 public constant MAX_FEI_LIMIT_PER_SECOND = 10_000e18; // 10000 FEI/s or ~860m FEI/day

    /// @notice the FEI per second mintable by this contract
    uint256 public feiLimitPerSecond;

    /// @notice the last time FEI was minted by the contract
    uint256 public lastMintTime;

    /// @notice the cap of FEI that can be minted at once
    uint256 public mintingBufferCap;

    /// @notice a flag for whether to allow partial mints to complete if the buffer is less than mint amount
    bool public doPartialMint;

    uint256 private _mintingBufferStored;

    event MintingBufferCapUpdate(uint256 oldMintingBufferCap, uint256 newMintingBufferCap);
    event FeiLimitPerSecondUpdate(uint256 oldFeiLimitPerSecond, uint256 newFeiLimitPerSecond);

    constructor(uint256 _feiLimitPerSecond, uint256 _mintingBufferCap, bool _doPartialMint) {
        lastMintTime = block.timestamp;

        _mintingBufferStored = _mintingBufferCap;
        _setMintingBufferCap(_mintingBufferCap);

        _setFeiLimitPerSecond(_feiLimitPerSecond);
        
        doPartialMint = _doPartialMint;
    }

    /// @notice set the FEI minting limit per second
    function setFeiLimitPerSecond(uint256 newFeiLimitPerSecond) external onlyGovernorOrAdmin {
        _setFeiLimitPerSecond(newFeiLimitPerSecond);
    }

    /// @notice set the minting buffer cap
    function setMintingBufferCap(uint256 newMintingBufferCap) external onlyGovernorOrAdmin {
        _setMintingBufferCap(newMintingBufferCap);
    }

    /// @notice the amount of FEI that can be minted before hitting limit
    /// @dev replenishes at feiLimitPerSecond FEI per second up to mintingBufferCap
    function mintingBuffer() public view returns(uint256) { 
        uint256 elapsed = block.timestamp - lastMintTime;
        return Math.min(_mintingBufferStored + (feiLimitPerSecond * elapsed), mintingBufferCap);
    }

    /// @notice override the FEI minting behavior to enfore a rate limit
    function _mintFei(address to, uint256 amount) internal virtual override {
        
        uint256 newMintingBuffer = mintingBuffer();
        
        uint256 mintAmount = amount;
        if (doPartialMint && mintAmount > newMintingBuffer) {
            mintAmount = newMintingBuffer;
        }

        require(mintAmount <= newMintingBuffer, "RateLimitedMinter: rate limit hit");

        _mintingBufferStored = newMintingBuffer - mintAmount;

        lastMintTime = block.timestamp;

        super._mintFei(to, mintAmount);
    }

    function _setFeiLimitPerSecond(uint256 newFeiLimitPerSecond) internal {
        require(newFeiLimitPerSecond <= MAX_FEI_LIMIT_PER_SECOND, "RateLimitedMinter: feiLimitPerSecond too high");

        // Reset the stored minting buffer and last mint time using the prior feiLimitPerSecond
        _mintingBufferStored = mintingBuffer();
        lastMintTime = block.timestamp;

        uint256 oldFeiLimitPerSecond = feiLimitPerSecond;
        feiLimitPerSecond = newFeiLimitPerSecond;

        emit FeiLimitPerSecondUpdate(oldFeiLimitPerSecond, newFeiLimitPerSecond);
    }

    function _setMintingBufferCap(uint256 newMintingBufferCap) internal {
        uint256 oldMintingBufferCap = mintingBufferCap;
        mintingBufferCap = newMintingBufferCap;

        // Cap the existing stored buffer
        if (_mintingBufferStored > newMintingBufferCap) {
            _mintingBufferStored = newMintingBufferCap;
        }

        emit MintingBufferCapUpdate(oldMintingBufferCap, newMintingBufferCap);
    }
}
