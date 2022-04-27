// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IMultiRateLimited.sol";

/// @notice global contract to handle rate limited minting of Fei on a global level
/// allows whitelisted minters to call in and specify the address to mint Fei to within
/// the calling contract's limits
interface IGlobalRateLimitedMinter is IMultiRateLimited {
    /// @notice function that all Fei minters call to mint Fei
    /// pausable and depletes the msg.sender's buffer
    /// @param to the recipient address of the minted Fei
    /// @param amount the amount of Fei to mint
    function mint(address to, uint256 amount) external;

    /// @notice mint Fei to the target address and deplete the whole rate limited
    ///  minter's buffer, pausable and completely depletes the msg.sender's buffer
    /// @param to the recipient address of the minted Fei
    /// mints all Fei that msg.sender has in the buffer
    function mintMaxAllowableFei(address to) external;
}
