pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./UniswapOracle.sol";
import "../refs/CoreRef.sol";
import "../external/SafeMathCopy.sol";
import "../pcv/EthUniswapPCVDeposit.sol";

/// @title Collateralization Oracle
/// @author eswak
contract CollateralizationOracle is IOracle, CoreRef {
    using Decimal for Decimal.D256;
    using SafeMathCopy for uint256;

    /// @notice reference oracles for various PCV currencies
    IUniswapOracle public ethPriceOracle;

    // @notice reference EthUniswapPCVDeposit
    EthUniswapPCVDeposit public ethUniswapPCVDeposit;

    /// @notice UniswapOracle constructor
    /// @param _core Fei Core for reference
    /// @param _ethPriceOracle Oracle for ETH price
    /// @param _ethUniswapPCVDeposit reference to the EthUniswapPCVDeposit contract
    constructor(
        address _core,
        address _ethPriceOracle,
        address payable _ethUniswapPCVDeposit
    ) public CoreRef(_core) {
        ethPriceOracle = UniswapOracle(_ethPriceOracle);
        ethUniswapPCVDeposit = EthUniswapPCVDeposit(_ethUniswapPCVDeposit);
    }

    /// @notice get the current circulating suply of FEI
    /// @return number of FEI in circulation
    function _circulatingFei() internal view returns(uint256) {
      (uint256 feiInPool, uint256 ethInPool) = ethUniswapPCVDeposit.getReserves();
      uint256 ethPcv = ethUniswapPCVDeposit.totalValue();
      uint256 feiPcv = Decimal.ratio(ethPcv, ethInPool).mul(feiInPool).asUint256();

      return Decimal.from(fei().totalSupply()).sub(feiPcv).asUint256();
    }

    /// @notice get the current ETH controlled by the protocol
    /// @return number of ETH in control of the protocol
    function _ethPcv() internal view returns(uint256) {
      return ethUniswapPCVDeposit.totalValue();
    }

    /// @notice get the current ETHUSD price from the ethPriceOracle
    /// @return price in USD per ETH
    function _ethUsd() internal view returns(uint256) {
      (Decimal.D256 memory ethPriceValue,) = ethPriceOracle.read();

      return ethPriceValue.asUint256();
    }

    function _collateralizationRatio() internal view returns(Decimal.D256 memory) {
      return Decimal.from(_ethUsd()).mul(_ethPcv()).div(_circulatingFei());
    }

    /// @notice updates the oracle price
    /// @return true if oracle is updated and false if unchanged
    function update() external override whenNotPaused returns (bool) {
        bool updated = ethPriceOracle.update();

        emit Update(_collateralizationRatio().asUint256());

        return updated;
    }

    /// @notice determine if read value is stale
    /// @return true if read value is stale
    function isOutdated() external view override returns (bool) {
        return ethPriceOracle.isOutdated();
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

    /// @notice get the current ETHUSD price from the ethPriceOracle
    /// @return price in USD per ETH
    function ethUsd() external view returns(uint256) {
      return _ethUsd();
    }

    /// @notice read the oracle value
    /// @return oracle value
    /// @return true if value is valid
    /// @dev price is to be denominated in percentage, with 18 decimals (1.25e18 for 125%)
    /// @dev Can be innacurate if outdated, need to call `isOutdated()` to check
    function read() external view override returns (Decimal.D256 memory, bool) {
        (, bool ethPriceOracleIsValid) = ethPriceOracle.read();
        bool valid = !paused() && ethPriceOracleIsValid;

        Decimal.D256 memory value = _collateralizationRatio();

        return (value, valid);
    }
}
