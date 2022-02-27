// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ICore.sol";

/// @title [OLD] Core V1 Interface
/// @author Fei Protocol
interface ICoreV1 is ICore {
    // ----------- Governor only state changing api -----------

    function setGenesisGroup(address token) external;

    // ----------- Read-only api -----------
    function genesisGroup() external view returns (address);
}
