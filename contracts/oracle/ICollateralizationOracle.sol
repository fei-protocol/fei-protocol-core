// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IOracle.sol";

/// @title Collateralization ratio oracle interface for Fei Protocol
/// @author Fei Protocol
interface ICollateralizationOracle is IOracle {

    // ----------- Getters -----------

    function isOvercollateralized() external view returns (bool);

    function userCirculatingFei() external view returns (uint256);

    function pcvValue() external view returns (uint256);

    function pcvEquityValue() external view returns (uint256);
}
