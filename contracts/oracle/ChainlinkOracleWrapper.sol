pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracle.sol";
import "../refs/CoreRef.sol";
import "../external/SafeMathCopy.sol";
import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

/// @title Chainlink oracle wrapper
/// @author eswak
/// @notice Reads a Chainlink oracle value & wrap it under the standard Fei oracle interface
contract ChainlinkOracleWrapper is IOracle, CoreRef {
    using Decimal for Decimal.D256;
    using SafeMathCopy for uint256;

    /// @notice the referenced chainlink oracle
    AggregatorV3Interface public chainlinkOracle;
    uint256 public oracleDecimalsNormalizer;

    /// @notice multiply the Chainlink oracle value by this constant, for instance for decimal corrections
    uint256 public k;
    uint256 public BASIS_POINTS_GRANULARITY = 10_000;

    /// @notice should this oracle return 1 / oraclePrice instead of oraclePrice ?
    bool public reverse;

    /// @notice ChainlinkOracleWrapper constructor
    /// @param _core Fei Core for reference
    /// @param _chainlinkOracle reference to the target Chainlink oracle
    /// @param _k constant to multiply Chainlink oracle value by
    /// @param _reverse should the price feed be inverted ?
    constructor(
        address _core,
        address _chainlinkOracle,
        uint256 _k,
        bool _reverse
    ) public CoreRef(_core) {
        chainlinkOracle = AggregatorV3Interface(_chainlinkOracle);
        k = _k;
        reverse = _reverse;

        _init();
    }

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
        (,int256 price,,,) = chainlinkOracle.latestRoundData();
        bool valid = !paused() && price > 0;

        Decimal.D256 memory value = Decimal.from(uint256(price)).div(oracleDecimalsNormalizer);
        if (reverse) {
          value = Decimal.one().div(value);
        }
        if (k != BASIS_POINTS_GRANULARITY) {
          value = value.mul(k).div(BASIS_POINTS_GRANULARITY);
        }

        return (value, valid);
    }
}
