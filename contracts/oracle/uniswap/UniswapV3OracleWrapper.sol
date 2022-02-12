// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";

import {CoreRef} from "../../refs/CoreRef.sol";
import {IOracle} from "../IOracle.sol";
import {Decimal} from "../../external/Decimal.sol";
import {IUniswapWrapper} from "./IUniswapWrapper.sol";

// TODO: Maybe check that the pool corresponds to the tokens we're interested in?
// TODO: Confirm price calculation is correct

/// @title UniswapV3 TWAP Oracle wrapper
/// @notice Reads a UniswapV3 TWAP oracle, based on a single Uniswap pool, and wraps it under 
/// the standard Fei interface
contract UniswapV3OracleWrapper is IOracle, CoreRef {
  using Decimal for Decimal.D256;

  address public pool;
  address inputToken;
  address outputToken;
  IUniswapWrapper private uniswapWrapper;
  OracleConfig public oracleConfig;

  uint16 private constant meanBlockTime = 13 seconds;

  struct OracleConfig {
    uint32 twapPeriod;
    uint32 minTwapPeriod;
    uint32 maxTwapPeriod;
    uint128 minPoolLiquidity;
    address uniswapPool;
  }

  event TwapPeriodUpdate(address indexed pool, uint32 oldTwapPeriod, uint32 newTwapPeriod);

  constructor(
    address _core,
    address _inputToken,
    address _outputToken,
    address _uniswapWrapper,
    OracleConfig memory _oracleConfig
  ) CoreRef(_core) {
    require(_core != address(0x0), "_core cannot be null address");
    require(_oracleConfig.uniswapPool != address(0x0), "_pool cannot be null address");
    require(_uniswapWrapper != address(0x0), "_uniswapWrapper cannot be null address");
    require(
      _oracleConfig.twapPeriod >= _oracleConfig.minTwapPeriod && _oracleConfig.twapPeriod <= _oracleConfig.maxTwapPeriod,
      "TWAP period out of bounds"
    );
    validatePoolLiquidity(_oracleConfig.uniswapPool, _oracleConfig.minPoolLiquidity);
    
    pool = _oracleConfig.uniswapPool;
    inputToken = _inputToken;
    outputToken = _outputToken;
    uniswapWrapper = IUniswapWrapper(_uniswapWrapper);   
    oracleConfig = _oracleConfig;

    addSupportForPool(pool, oracleConfig.twapPeriod, meanBlockTime);
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
    validatePoolLiquidity(pool, oracleConfig.minPoolLiquidity);

    uint256 rawPrice = uniswapWrapper.calculatePrice(
      pool, 
      oracleConfig.twapPeriod,
      inputToken,
      outputToken
    );

    bool valid = !paused();
    Decimal.D256 memory value = Decimal.from(rawPrice);
    return (value, valid);
  }

  /// @notice no-op, Uniswap V3 constantly updates the price
  function isOutdated() external view override returns (bool) {}


  // ----------- Internal -----------
  /// @notice Validate that the pool liquidity is above a safe minimum threshold
  function validatePoolLiquidity(address _pool, uint128 _minPoolLiquidity) internal view {
    require(
      IUniswapV3Pool(_pool).liquidity() >= _minPoolLiquidity,
      "Pool has insufficient liquidity"
    );
  }

  /// @notice Increase pool observation cardinality to support requested TWAP period
  function addSupportForPool(address _pool, uint32 _twapPeriod, uint16 _meanBlockTime) internal {
    uint16 requiredCardinality = uint16(_twapPeriod / _meanBlockTime) + 10; // Add additional number of slots to ensure available
    IUniswapV3Pool(_pool).increaseObservationCardinalityNext(requiredCardinality);
  }

  // ----------- Governor only state changing api -----------

  /// @notice Change the time period over which the TWAP price is calculated
  function setTwapPeriod(uint32 _twapPeriod) external onlyGuardianOrGovernor {
    require(
      _twapPeriod >= oracleConfig.minTwapPeriod && _twapPeriod <= oracleConfig.maxTwapPeriod,
      "TWAP period out of bounds"
    );

    uint32 oldTwapPeriod = oracleConfig.twapPeriod;
    oracleConfig.twapPeriod = _twapPeriod;
    emit TwapPeriodUpdate(pool, oldTwapPeriod, oracleConfig.twapPeriod);
  }
}