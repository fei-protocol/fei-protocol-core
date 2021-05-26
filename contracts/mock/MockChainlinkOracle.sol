// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract MockChainlinkOracle is AggregatorV3Interface {

    // fixed value
    int256 public value;
    uint8 public override decimals;

    constructor(int256 _value, uint8 _decimals) {
        value = _value;
        decimals = _decimals;
    }

    function description() external override pure returns (string memory) {
      return "MockChainlinkOracle";
    }

    function getRoundData(uint80 _roundId) external override view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
      return (_roundId, value, 1620651856, 1620651856, _roundId);
    }

    function latestRoundData() external override view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
      return (42, value, 1620651856, 1620651856, 42);
    }

    function version() external override pure returns (uint256) {
      return 1;
    }
}
