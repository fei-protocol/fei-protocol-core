// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ICollateralizationOracle.sol";

/// @title Collateralization ratio oracle interface for Fei Protocol
/// @author Fei Protocol
interface ICollateralizationOracleWrapper is ICollateralizationOracle {

    // ----------- Public state changing api -----------

    function updateIfOutdated() external;

    // ----------- Governor only state changing api -----------
    function setValidityDuration(uint256 _validityDuration) external;

    function setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints) external;

    function setCollateralizationOracle(address _newCollateralizationOracle) external;

    // ----------- Getters -----------

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
}