// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IAddressRateLimited.sol";

/// @notice global contract to handle rate limited minting of FEI on a global level
/// allows whitelisted minters to call in and specify the address to mint FEI to within
/// that contract's limits
interface IGlobalRateLimitedMinter is IAddressRateLimited {

    /// @notice FEI protocol system maximum amount of FEI replenishment per second
    function maximumGlobalFeiPerSecond() external view returns(uint256);
    
    /// @notice FEI protocol current amount of FEI replenishment per second
    function currentMaximumGlobalFeiPerSecond() external view returns(uint256);

    /// @notice FEI protocol system buffer cap maximum
    /// global maximum on buffer cap. This is the max amount of FEI that can be minted in a single tx
    function maximumGlobalBufferCap() external view returns(uint256);

    /// @notice Current FEI protocol system buffer cap maximum
    function currentMaximumGlobalBufferCap() external view returns(uint256);

    // ----------- Events -----------

    /// @notice emitted when fei per second is updated
    event MaxFeiPerSecondUpdate(uint256 oldFeiPerSecond, uint256 newFeiPerSecond);

    /// @notice emitted when the fei buffer cap is updated
    event MaxBufferCapUpdate(uint256 oldBufferCap, uint256 newBufferCap);

    /// @notice function that all FEI minters call to mint FEI
    /// pausable and depletes the msg.sender's buffer
    /// @param to the recipient address of the minted FEI
    /// @param amount the amount of FEI to mint
    function mintFei(address to, uint256 amount) external;

    /// @notice update the global fei per second replenishment
    /// @param _maximumGlobalFeiPerSecond the new global maximum fei per second replenishment
    function updateGlobalFeiPerSecond(uint256 _maximumGlobalFeiPerSecond) external;

    /// @notice update the global fei buffer cap
    /// @param _maximumGlobalBufferCap the new global maximum buffer cap
    function updateGlobalFeiBufferCap(uint256 _maximumGlobalBufferCap) external;
}
