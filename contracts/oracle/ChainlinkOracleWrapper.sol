// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracle.sol";
import "../refs/CoreRef.sol";
import "@openzeppelin/contracts/math/SafeMath.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

/// @title Chainlink oracle wrapper
/// @author eswak
/// @notice Reads a Chainlink oracle value & wrap it under the standard Fei oracle interface
contract ChainlinkOracleWrapper is IOracle, CoreRef {
    using Decimal for Decimal.D256;
    using SafeMath for uint256;

    /// @notice the referenced chainlink oracle
    AggregatorV3Interface public chainlinkOracle;
    uint256 public oracleDecimalsNormalizer;

    /// @notice ChainlinkOracleWrapper constructor
    /// @param _core Fei Core for reference
    /// @param _chainlinkOracle reference to the target Chainlink oracle
    constructor(
        address _core,
        address _chainlinkOracle
    ) public CoreRef(_core) {
        chainlinkOracle = AggregatorV3Interface(_chainlinkOracle);

        _init();
    }

    // @dev: decimals of the oracle are expected to never change, if Chainlink
    // updates that behavior in the future, we might consider reading the
    // oracle decimals() on every read() call.
    function _init() internal {
        uint8 oracleDecimals = chainlinkOracle.decimals();
        oracleDecimalsNormalizer = 10 ** uint256(oracleDecimals);
    }

    /// @notice updates the oracle price
    /// @return true if oracle is updated and false if unchanged
    function update() external override whenNotPaused returns (bool) {
        return false;
    }

    /// @notice determine if read value is stale
    /// @return true if read value is stale
    function isOutdated() external view override returns (bool) {
        return false;
    }

    /// @notice read the oracle price
    /// @return oracle price
    /// @return true if price is valid
    function read() external view override returns (Decimal.D256 memory, bool) {
        (uint80 roundId, int256 price,,, uint80 answeredInRound) = chainlinkOracle.latestRoundData();
        require(answeredInRound == roundId, "ChainlinkOracleWrapper: answeredInRound != roundId.");
        bool valid = !paused() && price > 0;

        Decimal.D256 memory value = Decimal.from(uint256(price)).div(oracleDecimalsNormalizer);
        return (value, valid);
    }
}
