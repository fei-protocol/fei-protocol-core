// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ICollateralizationOracle.sol";

/// @title Collateralization ratio oracle interface for Fei Protocol
/// @author Fei Protocol
interface ICollateralizationOracleWrapper is ICollateralizationOracle {

    // ----------- Events ------------------------------------------------------

    event CachedValueUpdate(
        address from,
        uint256 indexed protocolControlledValue,
        uint256 indexed userCirculatingFei,
        int256 indexed protocolEquity
    );

    event CollateralizationOracleUpdate(
        address from,
        address indexed oldOracleAddress,
        address indexed newOracleAddress
    );

    event DeviationThresholdUpdate(
        address from,
        uint256 indexed oldThreshold,
        uint256 indexed newThreshold
    );

    event ReadPauseOverrideUpdate(
        bool readPauseOverride
    );
    // ----------- Public state changing api -----------

    function updateIfOutdated() external;

    // ----------- Governor only state changing api -----------
    function setValidityDuration(uint256 _validityDuration) external;

    function setReadPauseOverride(bool newReadPauseOverride) external;

    function setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints) external;

    function setCollateralizationOracle(address _newCollateralizationOracle) external;

    function setCache(
        uint256 protocolControlledValue,
        uint256 userCirculatingFei,
        int256 protocolEquity
    ) external;

    // ----------- Getters -----------
    
    function cachedProtocolControlledValue() external view returns (uint256);
    
    function cachedUserCirculatingFei() external view returns (uint256);

    function cachedProtocolEquity() external view returns (int256);

    function deviationThresholdBasisPoints() external view returns (uint256);

    function collateralizationOracle() external view returns(address);

    function isOutdatedOrExceededDeviationThreshold() external view returns (bool);

    function pcvStatsCurrent() external view returns (
        uint256 protocolControlledValue,
        uint256 userCirculatingFei,
        int256 protocolEquity,
        bool validityStatus
    );

    function isExceededDeviationThreshold() external view returns (bool);

    function readPauseOverride() external view returns(bool);
}