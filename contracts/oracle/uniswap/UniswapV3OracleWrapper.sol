// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {SafeCast} from "@openzeppelin/contracts/utils/math/SafeCast.sol";
import {IUniswapV3Pool} from "@uniswap/v3-core/contracts/interfaces/IUniswapV3Pool.sol";
import {FixedPoint96} from "@uniswap/v3-core/contracts/libraries/FixedPoint96.sol";

import {CoreRef} from "../../refs/CoreRef.sol";
import {Decimal} from "../../external/Decimal.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";
import {IOracle} from "../IOracle.sol";
import {IUniswapV3OracleWrapper} from "./IUniswapV3OracleWrapper.sol";
import {IUniswapWrapper} from "./IUniswapWrapper.sol";

/// @title UniswapV3 TWAP Oracle wrapper
/// @notice Reads a UniswapV3 TWAP oracle, based on a single Uniswap pool, and wraps it under 
/// the standard Fei interface
contract UniswapV3OracleWrapper is IUniswapV3OracleWrapper, IOracle, CoreRef {
  using Decimal for Decimal.D256;
  using SafeCast for uint256;

  /// @notice Uniswap V3 pool which the oracle is built on
  address immutable public pool;

  /// @notice Input token for which a price is being determined
  address immutable public inputToken;
  
  /// @notice Output token
  address immutable public outputToken;

  /// @notice Uniswap wrapper contract which contains the oracle price calculation logic
  IUniswapWrapper immutable private uniswapWrapper;

  /// @notice Oracle configuration parameters
  OracleConfig public oracleConfig;

  /// @notice Mean Ethereum block time. Used in estimating the number of observations
  /// required on the Uniswap pool to support a particular TWAP period.
  uint32 public constant meanBlockTime = 13 seconds;

  /// @notice Type for the oracle configuration parameters
  /// @param twapPeriod Time period of which the time weighted average price is calculated
  /// @param minPoolLiquidity Safety parameter, minimum liquidity that must be present in the pool
  ///                          for the oracle reading to be permitted
  /// @param uniswapPool The Uniswap pool on which the oracle is based
  /// @param precision Number of decimal places to which the oracle price should be reported
  struct OracleConfig {
    uint32 twapPeriod;
    uint128 minPoolLiquidity;
    address uniswapPool;
    uint256 precision;
  }

  /// @notice An event emitted when the TWAP period is updated
  event TwapPeriodUpdate(address indexed pool, uint32 oldTwapPeriod, uint32 newTwapPeriod);

  /// @notice An event emitted when a Uniswap pool has oracle support added 
  event AddPoolSupport(address indexed pool, uint32 twapPeriod, uint16 cardinality);

  /// @notice UniswapV3OracleWrapper constructor
  /// @param _core Address of the Fei core contract
  /// @param _inputToken Address of the input token for which a price is being quoted
  /// @param _outputToken Address of the output token
  /// @param _uniswapWrapper Address of the Uniswap wrapper contract which contains price calculation logic 
  /// @param _oracleConfig Parameters for oracle function. Includes safety parameters
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
    
    validatePoolLiquidity(_oracleConfig.uniswapPool, _oracleConfig.minPoolLiquidity);
    validateTokensInPool(_oracleConfig.uniswapPool, _inputToken, _outputToken);
    validateTwapPeriod(_oracleConfig.twapPeriod);
    
    pool = _oracleConfig.uniswapPool;
    inputToken = _inputToken;
    outputToken = _outputToken;
    uniswapWrapper = IUniswapWrapper(_uniswapWrapper);   
    oracleConfig = _oracleConfig;

    addSupportForPool(_oracleConfig.uniswapPool, oracleConfig.twapPeriod, meanBlockTime);
    emit TwapPeriodUpdate(_oracleConfig.uniswapPool, 0, oracleConfig.twapPeriod); 
  }

  /// @notice updates the oracle price
  /// @dev no-op, Uniswap is updated automatically
  function update() external view override {}

  // ----------- Getters -----------

  /// @notice Convenience getter for twapPeriod
  function getTwapPeriod() external override view returns (uint32) {
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
      outputTokenDecimals,
      oracleConfig.precision
    );

    bool valid = !paused();
    
    // Divide out the extra decimals that decimal library adds
    Decimal.D256 memory value = Decimal.from(rawPrice).div(10**18);
    return (value, valid);
  }

  /// @notice no-op, Uniswap V3 constantly updates the price
  function isOutdated() external pure override returns (bool) {
    return false;
  }


  // ----------- Internal -----------

  /// @notice Validate that the pool liquidity is above a safe minimum threshold
  function validatePoolLiquidity(address _pool, uint128 _minPoolLiquidity) internal view {
    require(
      IUniswapV3Pool(_pool).liquidity() >= _minPoolLiquidity,
      "Pool has insufficient liquidity"
    );
  }

  /// @notice Validate that the single Uniswap pool has reserves in both input and output tokens
  /// @param _pool Uniswap pool address
  /// @param _inputToken Input token for which a price is being quoted
  /// @param _outputToken Output token
  function validateTokensInPool(address _pool, address _inputToken, address _outputToken) internal view {
    address uniswapToken0 = IUniswapV3Pool(_pool).token0();
    address uniswapToken1 = IUniswapV3Pool(_pool).token1();
    (address token0, address token1) = sortTokensAccordingToUniswap(_inputToken, _outputToken);
  
    require(
      uniswapToken0 == token0 && uniswapToken1 == token1,
      "Incorrect pool for tokens"
    );
  }

  /// @notice Validate that the TWAP period is within appropriate bounds
  /// @param _twapPeriod Time period over which the mean price is calculated
  function validateTwapPeriod(uint32 _twapPeriod) internal pure {
    require(_twapPeriod > 0, "Twap period must be greater than 0");
  }

  /// @notice Increase pool observation cardinality to support requested TWAP period
  function addSupportForPool(address _pool, uint32 _twapPeriod, uint32 _meanBlockTime) internal {
    uint16 requiredCardinality = uint16(_twapPeriod / _meanBlockTime) + uint16(10); // Add additional number of slots to ensure available

    IUniswapV3Pool(_pool).increaseObservationCardinalityNext(requiredCardinality);
    emit AddPoolSupport(_pool, _twapPeriod, requiredCardinality);
  }


  /// @notice Utility function to sort tokens, needed when calculating the tick, in the same order
  // as Uniswap does and assigns on pools
  /// @param tokenA Input token to be compared to Uniswap ordering
  /// @param tokenB Output token to be compared to Uniswap ordering
  function sortTokensAccordingToUniswap(address tokenA, address tokenB) internal pure returns (address, address) {
    (address token0, address token1) = tokenA < tokenB ? (tokenA, tokenB) : (tokenB, tokenA);
    return (token0, token1);
  }

  // ----------- Governor only state changing api -----------

  /// @notice Change the time period over which the TWAP price is calculated
  /// @param _twapPeriod Period of time over which time weighted average price is calculated
  function setTwapPeriod(uint32 _twapPeriod) external override hasAnyOfThreeRoles(TribeRoles.GOVERNOR, TribeRoles.GUARDIAN, TribeRoles.ORACLE_ADMIN) {
    validateTwapPeriod(_twapPeriod);

    uint32 oldTwapPeriod = oracleConfig.twapPeriod;
    oracleConfig.twapPeriod = _twapPeriod;
    emit TwapPeriodUpdate(pool, oldTwapPeriod, oracleConfig.twapPeriod);
  }
}