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

/// @title GOHM Eth Oracle
/// @notice Report the gOHM price in units of ETH. Calculated by reading a Chainlink OHM V2
///         oracle price and multiplying that by the queried OHM index
contract GOhmEthOracle is IOracle, CoreRef {
    using Decimal for Decimal.D256;

    /// @notice the referenced chainlink oracle
    AggregatorV3Interface public immutable chainlinkOHMETHOracle;

    /// @notice Oracle decimals normalizer
    uint256 public oracleDecimalsNormalizer;

    /// @notice gOHM token address.
    IgOHM public constant GOHM = IgOHM(0x0ab87046fBb341D058F17CBC4c1133F25a20a52f);

    /// @notice Maximum time since last update that the Chainlink oracle is considered valid
    uint256 public constant MAX_ORACLE_UPDATE_TIME = 1 weeks;

    /// @param _core Fei Core for reference
    /// @param _chainlinkOHMETHOracle Chainlink OHM V2 oracle reporting in terms of ETH
    constructor(address _core, address _chainlinkOHMETHOracle) CoreRef(_core) {
        chainlinkOHMETHOracle = AggregatorV3Interface(_chainlinkOHMETHOracle);
        _init();
    }

    // @dev: decimals of the oracle are expected to never change, if Chainlink
    // updates that behavior in the future, we might consider reading the
    // oracle decimals() on every read() call.
    function _init() internal {
        uint8 oracleDecimals = chainlinkOHMETHOracle.decimals();
        oracleDecimalsNormalizer = 10**uint256(oracleDecimals);
    }

    /// @notice Update the oracle price
    /// No-op, Chainlink is updated automatically. Price is multiplied by OHM index at runtime
    function update() external override whenNotPaused {}

    /// @notice determine if read value is stale
    /// @return true if read value is stale
    function isOutdated() external view override returns (bool) {
        (uint80 roundId, , , , uint80 answeredInRound) = chainlinkOHMETHOracle.latestRoundData();
        return answeredInRound != roundId;
    }

    /// @notice Determine the gOHM price. Report in units of ETH.
    /// @return oracle gOHM price in units of ETH
    /// @return true if price is valid
    function read() external view override returns (Decimal.D256 memory, bool) {
        (uint80 roundId, int256 ohmEthPrice, , uint256 updatedAt, uint80 answeredInRound) = chainlinkOHMETHOracle
            .latestRoundData();
        // Valid if not paused, price is greater than 0, Chainlink price answered in this round
        // and the Chainlink price updated happened at least within the last 24 hours.
        bool valid = !paused() &&
            ohmEthPrice > 0 &&
            answeredInRound == roundId &&
            updatedAt >= block.timestamp - MAX_ORACLE_UPDATE_TIME;

        // Fetch the OHM price and normalise for number of decimals
        // OHMV2 chainlink reports in ETH terms
        Decimal.D256 memory ohmEthValue = Decimal.from(uint256(ohmEthPrice)).div(oracleDecimalsNormalizer);

        // Multiple decimal by Index
        Decimal.D256 memory gOHMIndex = Decimal.from(GOHM.index());

        Decimal.D256 memory gOhmEthValue = ohmEthValue.mul(gOHMIndex).div(1e9); // 1e9 = OHM base unit and therefore also gOHM/OHM index base unit
        return (gOhmEthValue, valid);
    }
}
