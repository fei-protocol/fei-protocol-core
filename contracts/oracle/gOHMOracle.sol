// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";
import {Decimal, IOracle} from "./IOracle.sol";
import {CoreRef} from "../refs/CoreRef.sol";

interface IgOHM {
    function mint(address _to, uint256 _amount) external;

    function burn(address _from, uint256 _amount) external;

    function index() external view returns (uint256);

    function balanceFrom(uint256 _amount) external view returns (uint256);

    function balanceTo(uint256 _amount) external view returns (uint256);

    function migrate(address _staking, address _sOHM) external;
}

/// @title GOHM Oracle
/// @notice Determines the gOHM price by querying the OHM index and multiplying that by the
///         Chainlink OHM price
contract GOhmPriceOracle is IOracle, CoreRef {
    using Decimal for Decimal.D256;

    /// @notice the referenced chainlink oracle
    AggregatorV3Interface public chainlinkOHMOracle;

    /// @notice Oracle decimals normalizer
    uint256 public oracleDecimalsNormalizer;

    /// @notice gOHM token address.
    IgOHM public GOHM = IgOHM(0x0ab87046fBb341D058F17CBC4c1133F25a20a52f);

    /// @param _core Fei Core for reference
    /// @param _chainlinkOHMOracle Chainlink OHM V2 oracle
    constructor(address _core, address _chainlinkOHMOracle) CoreRef(_core) {
        chainlinkOHMOracle = AggregatorV3Interface(_chainlinkOHMOracle);
        _init();
    }

    // @dev: decimals of the oracle are expected to never change, if Chainlink
    // updates that behavior in the future, we might consider reading the
    // oracle decimals() on every read() call.
    function _init() internal {
        uint8 oracleDecimals = chainlinkOHMOracle.decimals();
        oracleDecimalsNormalizer = 10**uint256(oracleDecimals);
    }

    /// @notice Update the oracle price. Need to track if index is up to date or not.
    /// No-op, Chainlink is updated automatically. Price is multiplied by OHM index at runtime
    function update() external override whenNotPaused {}

    /// @notice determine if read value is stale
    /// @return true if read value is stale
    function isOutdated() external view override returns (bool) {
        (uint80 roundId, , , , uint80 answeredInRound) = chainlinkOHMOracle.latestRoundData();
        return answeredInRound != roundId;
    }

    /// @notice read the oracle price
    /// @return oracle price
    /// @return true if price is valid
    function read() external view override returns (Decimal.D256 memory, bool) {
        (uint80 roundId, int256 price, , , uint80 answeredInRound) = chainlinkOHMOracle.latestRoundData();
        bool valid = !paused() && price > 0 && answeredInRound == roundId;

        // Feth the OHM price and normalise for number of decimals
        Decimal.D256 memory value = Decimal.from(uint256(price)).div(oracleDecimalsNormalizer);

        // Multiple decimal by Index
        return (value.mul(Decimal.from(GOHM.index())), valid);
    }
}
