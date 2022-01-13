// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "../../oracle/collateralization/ICollateralizationOracle.sol";

/// @title a PCV Equity Minter Interface
/// @author Fei Protocol
interface IPCVEquityMinter {

    // ----------- Events -----------

    event APRUpdate(uint256 oldAprBasisPoints, uint256 newAprBasisPoints);

    event CollateralizationOracleUpdate(address oldCollateralizationOracle, address newCollateralizationOracle);

    // ----------- Governor only state changing api -----------

    function setCollateralizationOracle(ICollateralizationOracle newCollateralizationOracle) external;

    // ----------- Governor or Admin only state changing api -----------

    function setAPRBasisPoints(uint256 newAprBasisPoints) external;

    // ----------- Getters -----------

    function MAX_APR_BASIS_POINTS() external view returns(uint256);

    function collateralizationOracle() external view returns(ICollateralizationOracle);

    function aprBasisPoints() external view returns(uint256);
}
