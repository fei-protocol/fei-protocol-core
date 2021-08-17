// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../oracle/IOracle.sol";

/// @title a Tribe Reserve Stabilizer interface
/// @author Fei Protocol
interface ITribeReserveStabilizer {

    // ----------- Events -----------

    event FeiOracleUpdate(address indexed oldFeiOracle, address indexed newFeiOracle);

    event FeiPriceThresholdUpdate(uint256 oldFeiPriceThresholdBasisPoints, uint256 newFeiPriceThresholdBasisPoints);

    // ----------- Governor only state changing api -----------

    function setMinter(address newMinter) external;

    function mint(address to, uint256 amount) external;

    function setFeiOracle(IOracle newFeiOracle) external;

    function setFeiPriceThreshold(uint256 newFeiPriceThresholdBasisPoints) external;

    // ----------- Getters -----------

    function isFeiBelowThreshold() external view returns (bool);

    function feiOracle() external view returns (IOracle);

    function feiPriceThreshold() external view returns (Decimal.D256 calldata);
}
