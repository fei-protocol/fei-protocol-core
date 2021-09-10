// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IOracle.sol";
import "./ICollateralizationOracle.sol";
import "../utils/Timed.sol";
import "../refs/CoreRef.sol";

interface IPausable {
    function paused() external view returns (bool);
}

/// @title Fei Protocol's Collateralization Oracle
/// @author eswak
/// @notice Reads a list of PCVDeposit that report their amount of collateral
///         and the amount of protocol-owned FEI they manage, to deduce the
///         protocol-wide collateralization ratio.
contract CollateralizationOracleWrapper is ICollateralizationOracle, CoreRef {
    using Decimal for Decimal.D256;

    // ----------- Events ------------------------------------------------------

    event CachedValueUpdate(
        address from,
        uint256 indexed protocolControlledValue,
        uint256 indexed userCirculatingFei,
        int256 indexed protocolEquity
    );

    // ----------- Properties --------------------------------------------------

    /// @notice address of the CollateralizationOracle to memoize
    address public collateralizationOracle;

    /// @notice cached value of the Protocol Controlled Value
    uint256 public cachedProtocolControlledValue;
    /// @notice cached value of the User Circulating FEI
    uint256 public cachedUserCirculatingFei;
    /// @notice cached value of the Protocol Equity
    int256 public cachedProtocolEquity;

    /// @notice timestamp of the last read operation on the CollateralizationOracle
    uint256 public lastUpdate;
    /// @notice validity duration of the cached value
    uint256 public validityDuration;
    /// @notice deviation threshold to consider cached values outdated, in basis
    ///         points (base 10_000)
    uint256 public deviationThresholdBasisPoints;

    // ----------- Constructor -------------------------------------------------

    /// @notice CollateralizationOracle constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    // ----------- IOracle override methods ------------------------------------
    /// @notice update reading of the CollateralizationOracle
    function update() external override whenNotPaused {
        // fetch a fresh round of information
        (
            uint256 _protocolControlledValue,
            uint256 _userCirculatingFei,
            int256 _protocolEquity,
            bool _validityStatus
        ) = ICollateralizationOracle(collateralizationOracle).pcvStats();

        // only update if valid
        require(_validityStatus, "CollateralizationMemoizer: CollateralizationOracle is invalid");

        // set cache variables
        cachedProtocolControlledValue = _protocolControlledValue;
        cachedUserCirculatingFei = _userCirculatingFei;
        cachedProtocolEquity = _protocolEquity;
        lastUpdate = block.timestamp;

        // emit event
        emit CachedValueUpdate(
            msg.sender,
            cachedProtocolControlledValue,
            cachedUserCirculatingFei,
            cachedProtocolEquity
        );
    }

    // @notice returns true if the cached values are outdated.
    function isOutdated() public override view returns (bool outdated) {
        // check if cached value is fresh
        return block.timestamp > lastUpdate + validityDuration;
    }

    /// @notice Get the current collateralization ratio of the protocol, from cache.
    /// @return collateralRatio the current collateral ratio of the protocol.
    /// @return validityStatus the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function read() external view override returns (Decimal.D256 memory collateralRatio, bool validityStatus) {
        collateralRatio = Decimal.ratio(cachedProtocolControlledValue, cachedUserCirculatingFei);
        validityStatus = !paused() && !isOutdated();
    }

    // ----------- Wrapper-specific methods ------------------------------------
    // @notice returns true if the cached values are obsolete, i.e. the actual CR
    //         readings deviated from cached value by more than a threshold.
    //         This function is intended to be called off-chain by keepers.
    //         If executed on-chain, it consumes more gas than an actual update()
    //         call _and_ does not persist the read values in the cached state.
    function isExceededDeviationThreshold() public view returns (bool obsolete) {
        (
            uint256 _protocolControlledValue,
            uint256 _userCirculatingFei,
            , // int256 _protocolEquity,
            bool _validityStatus
        ) = ICollateralizationOracle(collateralizationOracle).pcvStats();

        require(_validityStatus, "CollateralizationMemoizer: CollateralizationOracle reading is invalid");

        Decimal.D256 memory _thresholdLow = Decimal.from(10_000 - deviationThresholdBasisPoints).div(10_000);
        Decimal.D256 memory _thresholdHigh = Decimal.from(10_000 + deviationThresholdBasisPoints).div(10_000);

        obsolete = !paused();

        // Protocol Controlled Value checks
        Decimal.D256 memory pcvRatio = Decimal.from(_protocolControlledValue).div(cachedProtocolControlledValue);
        // PCV < threshold
        obsolete = obsolete || pcvRatio.lessThan(_thresholdLow);
        // PCV > threshold
        obsolete = obsolete || pcvRatio.greaterThan(_thresholdHigh);

        // Circulating Fei checks
        Decimal.D256 memory circFeiRatio = Decimal.from(_userCirculatingFei).div(cachedUserCirculatingFei);
        // CircFEI < threshold
        obsolete = obsolete || circFeiRatio.lessThan(_thresholdLow);
        // CircFEI > threshold
        obsolete = obsolete || circFeiRatio.greaterThan(_thresholdHigh);
    }

    // @notice returns true if the cached values are obsolete or outdated, i.e.
    //         the reading is too old, or the actual CR readings deviated from cached
    //         value by more than a threshold.
    //         This function is intended to be called off-chain by keepers, to
    //         know if they should call the update() function. If executed on-chain,
    //         it consumes more gas than an actual update() + read() call _and_
    //         does not persist the read values in the cached state.
    function isOutdatedOrExceededDeviationThreshold() external view returns (bool) {
        return isOutdated() || isExceededDeviationThreshold();
    }

    // ----------- ICollateralizationOracle override methods -------------------

    /// @notice returns the Protocol-Controlled Value, User-circulating FEI, and
    ///         Protocol Equity. If there is a fresh cached value, return it.
    ///         Otherwise, call the CollateralizationOrache to get fresh data.
    /// @return protocolControlledValue : the total USD value of all assets held
    ///         by the protocol.
    /// @return userCirculatingFei : the number of FEI not owned by the protocol.
    /// @return protocolEquity : the difference between PCV and user circulating FEI.
    ///         If there are more circulating FEI than $ in the PCV, equity is 0.
    /// @return validityStatus : the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function pcvStats() external override view returns (
        uint256 protocolControlledValue,
        uint256 userCirculatingFei,
        int256 protocolEquity,
        bool validityStatus
    ) {
        validityStatus = !paused() && !isOutdated();
        protocolControlledValue = cachedProtocolControlledValue;
        userCirculatingFei = cachedUserCirculatingFei;
        protocolEquity = cachedProtocolEquity;
    }

    /// @notice returns true if the protocol is overcollateralized. Overcollateralization
    ///         is defined as the protocol having more assets in its PCV (Protocol
    ///         Controlled Value) than the circulating (user-owned) FEI, i.e.
    ///         a positive Protocol Equity.
    ///         Note: the validity status is ignored in this function.
    function isOvercollateralized() external override view returns (bool) {
        require(block.timestamp <= lastUpdate + validityDuration, "CollateralizationMemoizer: cache is outdated");
        return cachedProtocolEquity > 0;
    }

    // ----------- Wrapper-specific methods ------------------------------------

    /// @notice returns the Protocol-Controlled Value, User-circulating FEI, and
    ///         Protocol Equity, from an actual fresh call to the CollateralizationOracle.
    /// @return protocolControlledValue : the total USD value of all assets held
    ///         by the protocol.
    /// @return userCirculatingFei : the number of FEI not owned by the protocol.
    /// @return protocolEquity : the difference between PCV and user circulating FEI.
    ///         If there are more circulating FEI than $ in the PCV, equity is 0.
    /// @return validityStatus : the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function pcvStatsCurrent() external view returns (
        uint256 protocolControlledValue,
        uint256 userCirculatingFei,
        int256 protocolEquity,
        bool validityStatus
    ) {
      bool fetchedValidityStatus;
      (
          protocolControlledValue,
          userCirculatingFei,
          protocolEquity,
          fetchedValidityStatus
      ) = ICollateralizationOracle(collateralizationOracle).pcvStats();

      validityStatus = validityStatus && !paused() && !isOutdated();
    }
}
