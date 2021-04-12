pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IOracle.sol";
import "../refs/CoreRef.sol";
import "../external/SafeMathCopy.sol";
import "../pcv/UniswapPCVDeposit.sol";

/// @title Collateralization Oracle
/// @author eswak
contract CollateralizationOracle is IOracle, CoreRef {
    using Decimal for Decimal.D256;
    using SafeMathCopy for uint256;
    using Babylonian for uint256;

    /// @notice reference oracles for various PCV currencies
    IOracle public ethUsdPriceOracle;
    IOracle public ethFeiPriceOracle;

    // @notice reference EthUniswapPCVDeposit
    UniswapPCVDeposit public ethUniswapPCVDeposit;

    /// @notice UniswapOracle constructor
    /// @param _core Fei Core for reference
    /// @param _ethUsdPriceOracle Oracle for ETH price in USD
    /// @param _ethFeiPriceOracle Oracle for ETH price in FEI
    /// @param _ethUniswapPCVDeposit reference to the EthUniswapPCVDeposit contract
    constructor(
        address _core,
        address _ethUsdPriceOracle,
        address _ethFeiPriceOracle,
        address payable _ethUniswapPCVDeposit
    ) public CoreRef(_core) {
        ethUsdPriceOracle = IOracle(_ethUsdPriceOracle);
        ethFeiPriceOracle = IOracle(_ethFeiPriceOracle);
        ethUniswapPCVDeposit = UniswapPCVDeposit(_ethUniswapPCVDeposit);
    }

    /// @notice get the current circulating suply of FEI
    /// @return number of FEI in circulation
    function _circulatingFei() internal view returns(uint256) {
      (uint256 feiInPool, uint256 ethInPool) = ethUniswapPCVDeposit.getReserves();
      uint256 ethPcv = ethUniswapPCVDeposit.totalValue();
      uint256 feiPcv = Decimal.ratio(ethPcv, ethInPool).mul(feiInPool).asUint256();

      return fei().totalSupply() - feiPcv;
    }

    /// @notice get the current ETH controlled by the protocol
    /// @return number of ETH in control of the protocol
    function _ethPcv() internal view returns(uint256) {
      return ethUniswapPCVDeposit.totalValue();
    }

    /// @notice get the current ETHUSD price from the ethUsdPriceOracle
    /// @return price in USD per ETH
    function _ethUsd() internal view returns(uint256) {
      (Decimal.D256 memory ethPriceValue,) = ethUsdPriceOracle.read();

      return ethPriceValue.asUint256();
    }

    /// @notice get the current ETH and FEI in the Uniswap pool
    /// @return number of ETH in pool
    /// @return number of FEI in pool
    /// @return validity of the ETH-FEI price oracle
    function _ethFeiInPool() internal view returns(uint256, uint256, bool) {
      // external calls
      (uint256 feiInPool, uint256 ethInPool) = ethUniswapPCVDeposit.getReserves();
      (Decimal.D256 memory ethFei, bool ethFeiPriceOracleIsValid) = ethFeiPriceOracle.read();

      // resistant eth/fei in pool
      Decimal.D256 memory k = Decimal.from(feiInPool).mul(ethInPool);
      uint256 resistantEthInPool = k.div(ethFei).asUint256().sqrt();
      uint256 resistantFeiInPool = k.div(resistantEthInPool).asUint256();

      return (resistantEthInPool, resistantFeiInPool, ethFeiPriceOracleIsValid);
    }

    /// @notice get the current collateralization ratio
    /// @return collateralization ratio
    /// @return true if price is valid
    /// @dev price is to be denominated in percentage, with 18 decimals (1.25e18 for 125%)
    function _collateralizationRatio() internal view returns(Decimal.D256 memory, bool) {
      // external calls
      uint256 ethPcv = ethUniswapPCVDeposit.totalValue();
      uint256 feiTotalSupply = fei().totalSupply();
      (Decimal.D256 memory ethUsd, bool ethUsdPriceOracleIsValid) = ethUsdPriceOracle.read();
      (
        uint256 resistantEthInPool,
        uint256 resistantFeiInPool,
        bool ethFeiPriceOracleIsValid
      ) = _ethFeiInPool();

      // compute collateralization ratio & validity
      uint256 feiPcv = Decimal.ratio(ethPcv, resistantEthInPool).mul(resistantFeiInPool).asUint256();
      uint256 circulatingFei = feiTotalSupply - feiPcv;
      Decimal.D256 memory ratio = ethUsd.mul(ethPcv).div(circulatingFei);
      bool valid = !paused() && ethUsdPriceOracleIsValid && ethFeiPriceOracleIsValid;

      return (ratio, valid);
    }

    /// @notice updates the oracle price
    /// @return true if oracle is updated and false if unchanged
    function update() external override whenNotPaused returns (bool) {
        bool updated = ethUsdPriceOracle.update();
        updated = updated || ethFeiPriceOracle.update();

        (Decimal.D256 memory ratio,) = _collateralizationRatio();

        emit Update(ratio.asUint256());

        return updated;
    }

    /// @notice determine if read value is stale
    /// @return true if read value is stale
    function isOutdated() external view override returns (bool) {
        return ethUsdPriceOracle.isOutdated() || ethFeiPriceOracle.isOutdated();
    }

    /// @notice get the current circulating suply of FEI
    /// @return number of FEI in circulation
    function circulatingFei() external view returns(uint256) {
      return _circulatingFei();
    }

    /// @notice get the current ETH controlled by the protocol
    /// @return number of ETH in control of the protocol
    function ethPcv() external view returns(uint256) {
      return _ethPcv();
    }

    /// @notice get the current ETHUSD price from the ethUsdPriceOracle
    /// @return price in USD per ETH
    function ethUsd() external view returns(uint256) {
      return _ethUsd();
    }

    /// @notice get the current collateralization ratio
    /// @return collateralization ratio
    /// @dev price is to be denominated in percentage, with 18 decimals (1.25e18 for 125%)
    function collateralizationRatio() external view returns(uint256) {
      (Decimal.D256 memory ratio,) = _collateralizationRatio();
      return ratio.mul(1000000000000000000).asUint256();
    }

    /// @notice get a boolean wheter  current collateralization ratio
    /// @return true if the protocol is currently overcollateralized
    function overCollateralized() external view returns(bool) {
      (Decimal.D256 memory ratio,) = _collateralizationRatio();
      return ratio.mul(1000000000000000000).asUint256() > 1000000000000000000;
    }

    /// @notice read the oracle value
    /// @return oracle value
    /// @return true if value is valid
    /// @dev price is to be denominated in percentage, with 18 decimals (1.25e18 for 125%)
    /// @dev Can be innacurate if outdated, need to call `isOutdated()` to check
    function read() external view override returns (Decimal.D256 memory, bool) {
        return _collateralizationRatio();
    }
}
