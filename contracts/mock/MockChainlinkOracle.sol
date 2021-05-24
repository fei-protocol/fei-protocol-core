// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@chainlink/contracts/src/v0.6/interfaces/AggregatorV3Interface.sol";

contract MockChainlinkOracle is AggregatorV3Interface {

    // fixed value
    int256 public _value;
    uint8 public _decimals;

    constructor(int256 value, uint8 decimals) public {
        _value = value;
        _decimals = decimals;
    }

    function decimals() external override view returns (uint8) {
      return _decimals;
    }

    function description() external override view returns (string memory) {
      return "MockChainlinkOracle";
    }

    function getRoundData(uint80 _roundId) external override view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
      return (_roundId, _value, 1620651856, 1620651856, _roundId);
    }

    function latestRoundData() external override view returns (
        uint80 roundId,
        int256 answer,
        uint256 startedAt,
        uint256 updatedAt,
        uint80 answeredInRound
    ) {
      return (42, _value, 1620651856, 1620651856, 42);
    }

    function version() external override view returns (uint256) {
      return 1;
    }
}
