// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MultiRateLimited.sol";
import "./IGlobalRateLimitedMinter.sol";

/// @notice global contract to handle rate limited minting of FEI on a global level
/// allows whitelisted minters to call in and specify the address to mint FEI to within
/// that contract's limits
contract GlobalRateLimitedMinter is MultiRateLimited, IGlobalRateLimitedMinter {
    /// @param coreAddress address of the core contract
    /// @param _globalMaxRateLimitPerSecond maximum amount of fei that can replenish per second ever, this amount cannot be changed by governance
    /// @param _globalRateLimitPerSecond maximum rate limit per second per minter
    /// @param _bufferCap maximum global buffer cap
    /// @param _doPartialAction boolean to describe whether partial actions are allowed or not
    constructor(
        address coreAddress,
        uint256 _globalMaxRateLimitPerSecond,
        uint256 _globalRateLimitPerSecond,
        uint256 _bufferCap,
        bool _doPartialAction
    )
        MultiRateLimited(
            coreAddress,
            _globalMaxRateLimitPerSecond,
            _globalRateLimitPerSecond,
            _bufferCap,
            _doPartialAction
        )
    {}

    /// @notice mint fei to the target address and deplete the buffer
    /// pausable and depletes the msg.sender's buffer
    /// @param to the recipient address of the minted FEI
    /// @param amount the amount of FEI to mint
    function mintFei(address to, uint256 amount) external virtual override whenNotPaused {
        _depleteBuffer(msg.sender, amount);
        _mintFei(to, amount);
    }
}
