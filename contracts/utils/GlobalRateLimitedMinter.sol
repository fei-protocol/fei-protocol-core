// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {MultiRateLimited} from "./MultiRateLimited.sol";
import {IGlobalRateLimitedMinter} from "./IGlobalRateLimitedMinter.sol";
import {CoreRef} from "./../refs/CoreRef.sol";
import {Math} from "@openzeppelin/contracts/utils/math/Math.sol";

/// @notice global contract to handle rate limited minting of Fei on a global level
/// allows whitelisted minters to call in and specify the address to mint Fei to within
/// that contract's limits
contract GlobalRateLimitedMinter is MultiRateLimited, IGlobalRateLimitedMinter {
    /// @param core address of the core contract
    /// @param _globalMaxRateLimitPerSecond maximum amount of Fei that can replenish per second ever, this amount cannot be changed by governance
    /// @param _perAddressRateLimitMaximum maximum rate limit per second per address
    /// @param _maxRateLimitPerSecondPerAddress maximum rate limit per second per address in multi rate limited
    /// @param _maxBufferCap maximum buffer cap in multi rate limited contract
    /// @param _globalBufferCap maximum global buffer cap
    constructor(
        address core,
        uint112 _globalMaxRateLimitPerSecond,
        uint112 _perAddressRateLimitMaximum,
        uint112 _maxRateLimitPerSecondPerAddress,
        uint112 _maxBufferCap,
        uint112 _globalBufferCap
    )
        MultiRateLimited(
            core,
            _globalMaxRateLimitPerSecond,
            _perAddressRateLimitMaximum,
            _maxRateLimitPerSecondPerAddress,
            _maxBufferCap,
            _globalBufferCap
        )
    {}

    /// @notice mint Fei to the target address and deplete the buffer
    /// pausable and depletes the msg.sender's buffer
    /// @param to the recipient address of the minted Fei
    /// @param amount the amount of Fei to mint
    function mintFei(address to, uint256 amount)
        external
        virtual
        override
        whenNotPaused
    {
        _depleteIndividualBuffer(msg.sender, amount);
        _mintFei(to, amount);
    }

    /// @notice mints the maximum possible Fei to the target address
    /// @param to the recipient address of the minted Fei
    /// mints all Fei that msg.sender has in the buffer
    function mintMaxFei(address to) external virtual override whenNotPaused {
        // getBuffer is an overloaded function; no params = global buffer; address param = individual buffer
        // thus we take the min of global buffer & individual buffer
        uint256 amount = Math.min(getBuffer(msg.sender), getBuffer());

        _depleteIndividualBuffer(msg.sender, amount);
        _mintFei(to, amount);
    }
}
