// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title Interface for the Maker DAO PSMs
/// @dev gem refers to collateral tokens
interface IDSSPSM {
    /// @notice Swap DAI for the underlying collateral type
    function buyGem(address usr, uint256 gemAmt) external;

    /// @notice Swap collateral type for DAI
    function sellGem(address usr, uint256 gemAmt) external;
}
