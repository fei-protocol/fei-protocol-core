// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IOracle.sol";
import "./ICollateralizationOracle.sol";
import "../refs/CoreRef.sol";

interface IPausable {
    function paused() external view returns (bool);
}

/// @title Fei Protocol's Collateralization Oracle
/// @author eswak
/// @notice Reads a list of PCVDeposit that report their amount of collateral
///         and the amount of protocol-owned FEI they manage, to deduce the
///         protocol-wide collateralization ratio.

// TODO: rename CollaratalizationOracleWrapper
// TODO: use Timed utility
contract CollateralizationMemoizer is IOracle, CoreRef {
    using Decimal for Decimal.D256;

    // ----------- Events -----------

    event CachedValueUpdate(
        address from,
        uint256 indexed protocolControlledValue,
        uint256 indexed userCirculatingFei,
        int256 indexed protocolEquity
    );

    // ----------- Properties -----------

    /// @notice address of the CollateralizationOracle to memoize
    address public collateralizationOracle;

    // TODO should be private, probably don't need docs
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

    // TODO rename deviationThresholdBasisPoints
    /// @notice deviation threshold to consider cached values outdated, in basis
    ///         points (base 10_000)
    uint256 public deviationThreshold;

    // ----------- Constructor -----------

    /// @notice CollateralizationOracle constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    // ----------- IOracle override methods -----------
    /// @notice update reading of the CollateralizationOracle
    // TODO should this update the CR oracle base or no? I'd lean no but maybe it should
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

        // Update cached variables
        _setCache(_protocolControlledValue, _userCirculatingFei, _protocolEquity);
    }

    // @notice returns true if the cached values are outdated.
    // TODO function should be reworked with early returning to simplify readability
    function isOutdated() external override view returns (bool outdated) {
        // check if cached value is fresh
        if (block.timestamp > lastUpdate + validityDuration) {
            // TODO can just early return here 
            outdated = true;
        }
        // check if deviation thresholds are met
        if (!outdated) {
            (
                uint256 _protocolControlledValue,
                uint256 _userCirculatingFei,
                , // int256 _protocolEquity,
                bool _validityStatus
            ) = ICollateralizationOracle(collateralizationOracle).pcvStats();

            require(_validityStatus, "CollateralizationMemoizer: CollateralizationOracle reading is invalid");
            // TODO maybe add a helper method that returns % diff between two numbers
            // then invalidate if that number exceeds the threshold. Would be simpler logic

            Decimal.D256 memory _thresholdLow = Decimal.from(10_000 - deviationThreshold).div(10_000);
            Decimal.D256 memory _thresholdHigh = Decimal.from(10_000 + deviationThreshold).div(10_000);

            // PCV < threshold
            Decimal.D256 memory pcvRatio = Decimal.from(_protocolControlledValue).div(cachedProtocolControlledValue);
            outdated = outdated || pcvRatio.lessThan(_thresholdLow);
            // PCV > threshold
            if (!outdated) {
                outdated = outdated || pcvRatio.greaterThan(_thresholdHigh);
            }
            // CircFEI < threshold
            if (!outdated) {
                Decimal.D256 memory circFeiRatio = Decimal.from(_userCirculatingFei).div(cachedUserCirculatingFei);
                outdated = outdated || circFeiRatio.lessThan(_thresholdLow);
                // CircFEI > threshold
                if (!outdated) {
                    outdated = outdated || circFeiRatio.greaterThan(_thresholdHigh);
                }
            }
            // no need to check protocol equity, it is deduced from the other 2
        }
    }

    /// @notice Get the current collateralization ratio of the protocol, from cache.
    /// @return collateralRatio the current collateral ratio of the protocol.
    /// @return validityStatus the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function read() public view override returns (Decimal.D256 memory collateralRatio, bool validityStatus) {
        collateralRatio = Decimal.ratio(cachedProtocolControlledValue, cachedUserCirculatingFei);
        validityStatus = block.timestamp <= lastUpdate + validityDuration;
    }

    // ----------- ICollateralizationOracle override methods -----------

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
    // TODO this should be a view method and just return the cached values with a flag on staleness
    function pcvStats() external returns (
      uint256 protocolControlledValue,
      uint256 userCirculatingFei,
      int256 protocolEquity,
      bool validityStatus
    ) {
        validityStatus = !paused();

        // if data is fresh,
        if (block.timestamp <= lastUpdate + validityDuration) {
            protocolControlledValue = cachedProtocolControlledValue;
            userCirculatingFei = cachedUserCirculatingFei;
            protocolEquity = cachedProtocolEquity;
        }
        // else, fetch data
        else {
            bool fetchedValidityStatus;
            (
                protocolControlledValue,
                userCirculatingFei,
                protocolEquity,
                fetchedValidityStatus
            ) = ICollateralizationOracle(collateralizationOracle).pcvStats();

            validityStatus = validityStatus && fetchedValidityStatus;

            // refresh cached values if data is valid
            if (validityStatus) {
                _setCache(protocolControlledValue, userCirculatingFei, protocolEquity);
            }
        }
    }

    /// @notice returns true if the protocol is overcollateralized. Overcollateralization
    ///         is defined as the protocol having more assets in its PCV (Protocol
    ///         Controlled Value) than the circulating (user-owned) FEI, i.e.
    ///         a positive Protocol Equity.
    ///         Note: the validity status is ignored in this function.
    function isOvercollateralized() external view whenNotPaused returns (bool) {
        require(block.timestamp <= lastUpdate + validityDuration, "CollateralizationMemoizer: cache is outdated");
        return cachedProtocolEquity > 0;
    }

    // ---------------------- Internal methods ----------------------

    /// @notice set the cached values for the last read values from the
    ///         CollateralizationOrache, and emit the update event.
    function _setCache(
        uint256 protocolControlledValue,
        uint256 userCirculatingFei,
        int256 protocolEquity
    ) internal {
        // set cache variables
        cachedProtocolControlledValue = protocolControlledValue;
        cachedUserCirculatingFei = userCirculatingFei;
        cachedProtocolEquity = protocolEquity;
        lastUpdate = block.timestamp;

        // emit event
        emit CachedValueUpdate(
            msg.sender,
            cachedProtocolControlledValue,
            cachedUserCirculatingFei,
            cachedProtocolEquity
        );
    }
}
