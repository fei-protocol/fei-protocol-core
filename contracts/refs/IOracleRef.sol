// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../oracle/IOracle.sol";

/// @title OracleRef interface
/// @author Fei Protocol
interface IOracleRef {
    // ----------- Events -----------

    event OracleUpdate(address indexed oldOracle, address indexed newOracle);

    event BackupOracleUpdate(address indexed oldBackupOracle, address indexed newBackupOracle);


    // ----------- State changing API -----------

    function updateOracle() external returns (bool);

    // ----------- Governor only state changing API -----------

    function setOracle(address newOracle) external;

    function setBackupOracle(address newBackupOracle) external;

    // ----------- Getters -----------

    function oracle() external view returns (IOracle);

    function backupOracle() external view returns (IOracle);

    function readOracle() external view returns (Decimal.D256 memory);

    function invert(Decimal.D256 calldata price)
        external
        pure
        returns (Decimal.D256 memory);
}
