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
  IUniswapWrapper private uniswapWrapper;
  OracleConfig public oracleConfig;

  struct OracleConfig {
    uint32 twapPeriod;
    uint32 minTwapPeriod;
    uint32 maxTwapPeriod;
  }

  event TwapPeriodUpdate(address indexed pool, uint32 oldTwapPeriod, uint32 newTwapPeriod);

  constructor(
    address _core,
    address _pool,
    address _uniswapWrapper,
    OracleConfig memory _oracleConfig
  ) CoreRef(_core) {
    require(_core != address(0x0), "_core cannot be null address");
    require(_pool != address(0x0), "_pool cannot be null address");
    require(_uniswapWrapper != address(0x0), "_uniswapWrapper cannot be null address");
    require(
      _oracleConfig.twapPeriod >= _oracleConfig.minTwapPeriod && _oracleConfig.twapPeriod <= _oracleConfig.maxTwapPeriod,
      "TWAP period out of bounds"
    );

    // TODO: Add a safeguard about minimum amount of liquidity in the Uniswap position?
    
    pool = _pool;
    uniswapWrapper = IUniswapWrapper(_uniswapWrapper);   
    oracleConfig = _oracleConfig;

    emit TwapPeriodUpdate(pool, 0, oracleConfig.twapPeriod); 
  }

  /// @notice updates the oracle price
  /// @dev no-op, Uniswap is updated automatically
  function update() external view override {}

  // ----------- Getters -----------

  /// @notice Convenience getter for twapPeriod
  function getTwapPeriod() external view returns (uint32) {
    return oracleConfig.twapPeriod;
  }

  /// @notice Read the oracle price
  function read() external view override returns (Decimal.D256 memory, bool) {
    validateNumOberservationSlots(oracleConfig.twapPeriod);

    // TODO: Not convinced this returns what we need
    uint256 rawPrice = uniswapWrapper.calculatePrice(pool, oracleConfig.twapPeriod);

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
  function validateNumOberservationSlots(uint32 _twapPeriod) internal view {
      uint16 observationCardinality = uniswapWrapper.getObservationCardinality(pool);

      // 1 observation = 1 block ~ 11 seconds
      uint16 approxBlockTime = uint16(11);
      uint16 requestedTwapPeriodInBlocks = uint16(_twapPeriod) / approxBlockTime; 
      require(requestedTwapPeriodInBlocks < observationCardinality,
        "Insufficient pool observation slots");
  }


  // ----------- Governor only state changing api -----------

  /// @notice Change the time period over which the TWAP price is calculated
  function setTwapPeriod(uint32 _twapPeriod) external onlyGuardianOrGovernor {
    require(
      _twapPeriod >= oracleConfig.minTwapPeriod && _twapPeriod <= oracleConfig.maxTwapPeriod,
      "TWAP period out of bounds"
    );
    validateNumOberservationSlots(_twapPeriod);

    uint32 oldTwapPeriod = oracleConfig.twapPeriod;
    oracleConfig.twapPeriod = _twapPeriod;
    emit TwapPeriodUpdate(pool, oldTwapPeriod, oracleConfig.twapPeriod);
  }
}