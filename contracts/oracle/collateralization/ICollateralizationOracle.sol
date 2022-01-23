// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ICollateralizationOracleBase.sol";

/// @title Collateralization ratio oracle interface for Fei Protocol
/// @author Fei Protocol
interface ICollateralizationOracle is ICollateralizationOracleBase {
    function addDeposit(address deposit) external;

    function tokenToOracle(address token) external view returns(address oracle);

    function depositToToken(address deposit) external view returns(address token);
}