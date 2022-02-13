// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";

import {CoreRef} from "../../refs/CoreRef.sol";
import {IOracle} from "../IOracle.sol";
import {Decimal} from "../../external/Decimal.sol";
import {IUniswapWrapper} from "./IUniswapWrapper.sol";
import "hardhat/console.sol";

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

  // TODO: Confirm this is constant across Uniswap pools/tokens. Check Uniswap normalises out
  uint256 public constant uniswapDecimalsNormalizer = 10 ** uint256(18);

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
    validateTokensInPool(_oracleConfig.uniswapPool, _inputToken,_outputToken);
    
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

    uint8 inputTokenDecimals = ERC20(inputToken).decimals();
    uint8 outputTokenDecimals = ERC20(outputToken).decimals();
    uint256 rawPrice = uniswapWrapper.calculatePrice(
      pool, 
      oracleConfig.twapPeriod,
      inputToken,
      outputToken,
      inputTokenDecimals,
      outputTokenDecimals
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

  /// @notice Validate that the single Uniswap pool has reserves in both input and output tokens
  function validateTokensInPool(address _pool, address _inputToken, address _outputToken) internal view {
    address uniswapToken0 = IUniswapV3Pool(_pool).token0();
    address uniswapToken1 = IUniswapV3Pool(_pool).token1();
    (address token0, address token1) = sortTokensAccordingToUniswap(_inputToken, _outputToken);
  
    require(
      uniswapToken0 == token0 || uniswapToken1 == token1,
      "Incorrect pool for tokens"
    );
  }

  /// @notice Utility function to sort tokens, needed when calculating the tick, in the same order
  // as Uniswap does and assigns on pools
  function sortTokensAccordingToUniswap(address tokenA, address tokenB) internal view returns (address, address) {
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    return (token0, token1);
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