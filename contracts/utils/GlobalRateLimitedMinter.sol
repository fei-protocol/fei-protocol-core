// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./AddressRateLimited.sol";

/// @notice global contract to handle rate limited minting of FEI on a global level
/// allows whitelisted minters to call in and specify the address to mint FEI to within
/// that contract's limits
contract GlobalRateLimitedMinter is AddressRateLimited {

    /// @notice FEI protocol system maximum amount of FEI replenishment per second
    uint256 public maximumGlobalFeiPerSecond;
    
    /// @notice FEI protocol current amount of FEI replenishment per second
    uint256 public currentMaximumGlobalFeiPerSecond;

    /// @notice FEI protocol system buffer cap maximum
    /// global maximum on buffer cap. This is the max amount of FEI that can be minted in a single tx
    uint256 public maximumGlobalBufferCap;

    /// @notice Current FEI protocol system buffer cap maximum
    uint256 public currentMaximumGlobalBufferCap;

    // ----------- Events -----------

    /// @notice emitted when fei per second is updated
    event MaxFeiPerSecondUpdate(uint256 oldFeiPerSecond, uint256 newFeiPerSecond);

    /// @notice emitted when the fei buffer cap is updated
    event MaxBufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap);

    /// @param coreAddress address of the core contract
    /// @param _maximumGlobalFeiPerSecond maximum amount of fei that can replenish per second
    /// @param _maximumGlobalBufferCap maximum global buffer cap
    /// @param _maxRateLimitPerSecond maximum rate limit per second per minter
    /// @param maxBufferCap maximum buffer cap per minter
    /// @param _doPartialAction boolean to describe whether partial actions are allowed or not
    constructor(
        address coreAddress,
        uint256 _maximumGlobalFeiPerSecond,
        uint256 _maximumGlobalBufferCap,
        uint256 _maxRateLimitPerSecond,
        uint256 maxBufferCap,
        bool _doPartialAction
    )
        CoreRef(coreAddress)
        AddressRateLimited(_maxRateLimitPerSecond, maxBufferCap, _doPartialAction)
    {
        maximumGlobalFeiPerSecond = _maximumGlobalFeiPerSecond;
        maximumGlobalBufferCap = _maximumGlobalBufferCap;
    }

    /// @notice function that all FEI minters call to mint FEI
    /// pausable and depletes the msg.sender's buffer
    /// @param to the recipient address of the minted FEI
    /// @param amount the amount of FEI to mint
    function mintFei(address to, uint256 amount) external whenNotPaused {
        _mintFei(to, amount);
    }

    /// @notice set the new rate limit for the specified minter
    /// @param _minter the address whose buffer will be set
    /// @param _rateLimitPerSecond the new rate limit per second for this minter
    function setRateLimitPerSecond(address _minter, uint256 _rateLimitPerSecond) public override virtual onlyGovernorOrAdmin {
        uint256 currentRateLimitPerSecond = rateLimitPerSecond[_minter];

        require(
            currentMaximumGlobalFeiPerSecond + _rateLimitPerSecond - currentRateLimitPerSecond <= maximumGlobalFeiPerSecond,
            "GlobalRateLimitedMinter: max fei per second exceeded"
        );

        currentMaximumGlobalFeiPerSecond = currentMaximumGlobalFeiPerSecond + _rateLimitPerSecond - currentRateLimitPerSecond;

        super.setRateLimitPerSecond(_minter, _rateLimitPerSecond);
    }

    /// @notice set the buffer cap for the specified minter
    /// @param _minter the address whose buffer will be set
    /// @param _bufferCap the new buffer cap for this minter
    function setBufferCap(address _minter, uint256 _bufferCap) external override virtual onlyGovernorOrAdmin {
        uint256 currentBufferCap = bufferCap[_minter];

        require(
            currentMaximumGlobalBufferCap + _bufferCap - currentBufferCap <= maximumGlobalBufferCap,
            "GlobalRateLimitedMinter: max fei buffer cap exceeded"
        );

        currentMaximumGlobalBufferCap = currentMaximumGlobalBufferCap + _bufferCap - currentBufferCap;

        _setBufferCap(_minter, _bufferCap);
    }

    /// @notice add an address as an authorized minter
    /// @param _minter the new address to add as a minter
    /// @param _rateLimitPerSecond the rate limit per second for this minter
    /// @param _bufferCap  the buffer cap for this minter
    function addMinter(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) public override virtual onlyGovernorOrAdmin {
        require(
            currentMaximumGlobalFeiPerSecond + _rateLimitPerSecond <= maximumGlobalBufferCap,
            "GlobalRateLimitedMinter: max fei per second exceeded"
        );
        require(
            currentMaximumGlobalBufferCap + _bufferCap <= maximumGlobalBufferCap,
            "GlobalRateLimitedMinter: max fei buffer cap exceeded"
        );

        currentMaximumGlobalBufferCap += _bufferCap;
        currentMaximumGlobalFeiPerSecond += _rateLimitPerSecond;

        super.addMinter(_minter, _rateLimitPerSecond, _bufferCap);
    }

    /// @notice update the buffercap and rate limit per second for a minter
    /// @param _minter the address whose buffer and rate limit per second will be set
    /// @param _rateLimitPerSecond the new rate limit per second for this minter
    /// @param _bufferCap  the new buffer cap for this minter
    function updateMinter(address _minter, uint256 _rateLimitPerSecond, uint256 _bufferCap) public override onlyGovernorOrAdmin {
        uint256 currentRateLimitPerSecond = rateLimitPerSecond[_minter];
        uint256 currentBufferCap = bufferCap[_minter];

        require(
            currentMaximumGlobalFeiPerSecond + _rateLimitPerSecond - currentRateLimitPerSecond <= maximumGlobalFeiPerSecond,
            "GlobalRateLimitedMinter: rate limit exceeds global max"
        );
        require(
            currentMaximumGlobalBufferCap + _bufferCap - currentBufferCap <= maximumGlobalBufferCap,
            "GlobalRateLimitedMinter: buffer cap exceeds global max"
        );

        currentMaximumGlobalFeiPerSecond = currentMaximumGlobalFeiPerSecond + _rateLimitPerSecond - currentRateLimitPerSecond;
        currentMaximumGlobalBufferCap = currentMaximumGlobalBufferCap + _bufferCap - currentBufferCap;

        super.updateMinter(_minter, _rateLimitPerSecond, _bufferCap);
    }

    /// @notice remove specified minter from the system
    /// @param _minter the address to remove from the whitelist of minters
    function removeMinter(address _minter) public override isGovernorOrGuardianOrAdmin {
        uint256 currentRateLimitPerSecond = rateLimitPerSecond[_minter];
        uint256 currentBufferCap = bufferCap[_minter];

        currentMaximumGlobalFeiPerSecond -= currentRateLimitPerSecond;
        currentMaximumGlobalBufferCap -= currentBufferCap;

        super.removeMinter(_minter);
    }

    /// @notice update the global fei per second replenishment
    /// @param _maximumGlobalFeiPerSecond the new global maximum fei per second replenishment
    function updateGlobalFeiPerSecond(uint256 _maximumGlobalFeiPerSecond) external onlyGovernorOrAdmin {
        uint256 oldMaximumGlobalFeiPerSecond = maximumGlobalFeiPerSecond;
        maximumGlobalFeiPerSecond = _maximumGlobalFeiPerSecond;

        emit MaxFeiPerSecondUpdate(oldMaximumGlobalFeiPerSecond, maximumGlobalFeiPerSecond);
    }

    /// @notice update the global fei buffer cap
    /// @param _maximumGlobalBufferCap the new global maximum buffer cap
    function updateGlobalFeiBufferCap(uint256 _maximumGlobalBufferCap) external onlyGovernorOrAdmin {
        uint256 oldMaximumGlobalBufferCap = maximumGlobalBufferCap;
        maximumGlobalBufferCap = _maximumGlobalBufferCap;

        emit MaxBufferCapUpdate(oldMaximumGlobalBufferCap, maximumGlobalFeiPerSecond);
    }
}
