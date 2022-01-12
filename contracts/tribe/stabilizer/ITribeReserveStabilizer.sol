// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../oracle/collateralization/ICollateralizationOracle.sol";

/// @title a Tribe Reserve Stabilizer interface
/// @author Fei Protocol
interface ITribeReserveStabilizer {

    // ----------- Events -----------

    event CollateralizationOracleUpdate(address indexed oldCollateralizationOracle, address indexed newCollateralizationOracle);

    event CollateralizationThresholdUpdate(uint256 oldCollateralizationThresholdBasisPoints, uint256 newCollateralizationThresholdBasisPoints);

    // ----------- Governor only state changing api -----------

    function setCollateralizationOracle(ICollateralizationOracle newCollateralizationOracle) external;

    function setCollateralizationThreshold(uint256 newCollateralizationThresholdBasisPoints) external;

    function startOracleDelayCountdown() external;

    function resetOracleDelayCountdown() external;

    // ----------- Getters -----------

    function isCollateralizationBelowThreshold() external view returns (bool);

    function collateralizationOracle() external view returns (ICollateralizationOracle);

    function collateralizationThreshold() external view returns (Decimal.D256 calldata);
}
