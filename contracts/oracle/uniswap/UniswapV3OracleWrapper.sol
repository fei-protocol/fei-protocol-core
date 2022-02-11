// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";

import {CoreRef} from "../../refs/CoreRef.sol";
import {IOracle, Decimal} from "../IOracle.sol";
import {IUniswapWrapper} from "./IUniswapWrapper.sol";


/// @title UniswapV3 TWAP Oracle wrapper
/// @notice Reads a UniswapV3 TWAP oracle and wraps it under the standard Fei interface
contract UniswapV3OracleWrapper is IOracle, CoreRef {
  using Decimal for Decimal.D256;

  address public pool;
  uint32 public secondsAgo;
  IUniswapWrapper private uniswapWrapper;

  event TwapPeriodUpdate(address indexed pool, uint32 oldSecondsAgo, uint32 newSecondsAgo);

  constructor(
    address _core,
    address _pool,
    uint32 _secondsAgo,
    address _uniswapWrapper
  ) CoreRef(_core) {
    pool = _pool;
    secondsAgo = _secondsAgo;
    uniswapWrapper = IUniswapWrapper(_uniswapWrapper);    
  }

  /// @notice updates the oracle price
  /// @dev no-op, Uniswap is updated automatically
  function update() external view override {}

  // ----------- Getters -----------

  function read() external view override returns (Decimal.D256 memory, bool) {
    validateNumOberservationSlots(secondsAgo);

    uint256 rawPrice = uniswapWrapper.calculatePrice(pool, secondsAgo);

    bool valid = !paused() && validatePrice(rawPrice);
    Decimal.D256 memory value = Decimal.from(rawPrice);
    return (value, valid);
  }

  /// @notice no-op, Uniswap V3 constantly updates the price
  function isOutdated() external view override returns (bool) {}


  // ----------- Internal -----------
  /// @notice Validate that the slippage caused by a proposed trade is acceptable
  /// Does this check belong here? Maybe ideally in whatever executes the trade?
  function validatePrice(uint256 rawPrice) internal view returns (bool) {
    return true;
  }

  /// @notice Validate that the UniswapV3 pool has sufficient observation slots
  /// to support the requested TWAP period. If not revert and 
  //  `pool.increaseObservationCardinalityNext()` should be called
  function validateNumOberservationSlots(uint32 _secondsAgo) internal view {
      uint16 observationCardinality = uniswapWrapper.getObservationCardinality(pool);

      // 1 observation = 1 block ~ 11 seconds
      uint16 approxBlockTime = uint16(11);
      uint16 requestedTwapPeriodInBlocks = uint16(_secondsAgo) / approxBlockTime; 
      require(requestedTwapPeriodInBlocks < observationCardinality,
        "Insufficient pool observation slots");
  }


  // ----------- Governor only state changing api -----------

  /// @notice Change the time period over which the TWAP price is calculated
  function setSecondsAgo(uint32 _secondsAgo) external onlyGuardianOrGovernor {
    validateNumOberservationSlots(_secondsAgo);
    uint32 oldSecondsAgo = secondsAgo;
    secondsAgo = _secondsAgo;
    emit TwapPeriodUpdate(pool, oldSecondsAgo, secondsAgo);
  }
}