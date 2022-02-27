// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../refs/CoreRef.sol";
import "./IOracle.sol";

/// @title A composite oracle
/// @author Fei Protocol
/// @notice Reads two oracles and returns their product
contract CompositeOracle is IOracle, CoreRef {
    using Decimal for Decimal.D256;

    /// @notice the first referenced oracle
    IOracle public oracleA;
    /// @notice the second referenced oracle
    IOracle public oracleB;

    /// @notice CompositeOracle constructor
    /// @param _oracleA first referenced oracle
    /// @param _oracleB second referenced oracle
    constructor(
        address _core,
        IOracle _oracleA,
        IOracle _oracleB
    ) CoreRef(_core) {
        oracleA = _oracleA;
        oracleB = _oracleB;
    }

    /// @notice updates the oracle price
    function update() external override whenNotPaused {
        oracleA.update();
        oracleB.update();
    }

    /// @notice determine if read value is stale
    /// @return true if read value is stale
    function isOutdated() external view override returns (bool) {
        return oracleA.isOutdated() || oracleB.isOutdated();
    }

    /// @notice read the oracle price
    /// @return oracle price
    /// @return true if price is valid
    function read() external view override returns (Decimal.D256 memory, bool) {
        (Decimal.D256 memory priceA, bool validA) = oracleA.read();
        (Decimal.D256 memory priceB, bool validB) = oracleB.read();
        bool valid = !paused() && validA && validB;

        return (priceA.mul(priceB), valid);
    }
}
