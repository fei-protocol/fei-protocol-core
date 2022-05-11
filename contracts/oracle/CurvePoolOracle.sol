// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "./IOracle.sol";
import "../external/Decimal.sol";
import "../pcv/curve/ICurveStableSwap3.sol";

/// @title CurvePoolOracle
/// @author eswak
/// @notice a contract to report the USD value of a Curve Plain Pool's tokens (LP tokens).
/// @dev Do not deploy this oracle for pools where ETH or an ERC777/ERC677/ERC223 token
/// is used and is not the last asset, as there could be an oracle manipulation on the
/// call to get_virtual_price().
contract CurvePoolOracle is IOracle {
    using Decimal for Decimal.D256;

    /// @notice the Curve pool to look at
    ICurveStableSwap3 public immutable curvePool;

    /// @notice the oracle for pool tokens (it's a stableswap, all tokens have the same value)
    IOracle public oracle;

    constructor(ICurveStableSwap3 _pool, IOracle _oracle) {
        curvePool = _pool;
        oracle = _oracle;
    }

    /// @notice update underlying token oracle
    function update() external override {
        oracle.update();
    }

    /// @notice returns true if the underlying oracle is outdated
    function isOutdated() external view override returns (bool outdated) {
        return oracle.isOutdated();
    }

    function read() public view override returns (Decimal.D256 memory, bool) {
        (Decimal.D256 memory oracleValue, bool oracleValid) = oracle.read();
        uint256 virtualPrice = curvePool.get_virtual_price();
        return (oracleValue.mul(virtualPrice).div(1e18), oracleValid);
    }
}
