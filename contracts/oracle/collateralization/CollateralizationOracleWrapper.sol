// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../IOracle.sol";
import "./ICollateralizationOracleWrapper.sol";
import "../../Constants.sol";
import "../../utils/Timed.sol";
import "../../refs/CoreRef.sol";

interface IPausable {
    function paused() external view returns (bool);
}

/// @title Fei Protocol's Collateralization Oracle
/// @author eswak
/// @notice Reads a list of PCVDeposit that report their amount of collateral
///         and the amount of protocol-owned FEI they manage, to deduce the
///         protocol-wide collateralization ratio.
contract CollateralizationOracleWrapper is Timed, ICollateralizationOracleWrapper, CoreRef {
    using Decimal for Decimal.D256;

    // ----------- Properties --------------------------------------------------

    /// @notice address of the CollateralizationOracle to memoize
    address public override collateralizationOracle;

    /// @notice cached value of the Protocol Controlled Value
    uint256 public override cachedProtocolControlledValue;
    /// @notice cached value of the User Circulating FEI
    uint256 public override cachedUserCirculatingFei;
    /// @notice cached value of the Protocol Equity
    int256 public override cachedProtocolEquity;

    /// @notice deviation threshold to consider cached values outdated, in basis
    ///         points (base 10_000)
    uint256 public override deviationThresholdBasisPoints;

    /// @notice a flag to override pause behavior for reads
    bool public override readPauseOverride;

    // ----------- Constructor -------------------------------------------------

    /// @notice CollateralizationOracleWrapper constructor
    /// @param _core Fei Core for reference.
    /// @param _validityDuration the duration after which a reading becomes outdated.
    constructor(
        address _core,
        uint256 _validityDuration
    ) CoreRef(_core) Timed(_validityDuration) {}

    /// @notice CollateralizationOracleWrapper initializer
    /// @param _core Fei Core for reference.
    /// @param _collateralizationOracle the CollateralizationOracle to inspect.
    /// @param _validityDuration the duration after which a reading becomes outdated.
    /// @param _deviationThresholdBasisPoints threshold for deviation after which
    ///        keepers should call the update() function.
    function initialize(
        address _core,
        address _collateralizationOracle,
        uint256 _validityDuration,
        uint256 _deviationThresholdBasisPoints
    ) public {
        require(collateralizationOracle == address(0), "CollateralizationOracleWrapper: initialized");
        CoreRef._initialize(_core);
        _setDuration(_validityDuration);
        collateralizationOracle = _collateralizationOracle;
        deviationThresholdBasisPoints = _deviationThresholdBasisPoints;

        // Shared admin with other oracles
        _setContractAdminRole(keccak256("ORACLE_ADMIN_ROLE"));    
    }

    // ----------- Setter methods ----------------------------------------------

    /// @notice set the address of the CollateralizationOracle to inspect, and
    /// to cache values from.
    /// @param _newCollateralizationOracle the address of the new oracle.
    function setCollateralizationOracle(address _newCollateralizationOracle) external override onlyGovernor {
        require(_newCollateralizationOracle != address(0), "CollateralizationOracleWrapper: invalid address");
        address _oldCollateralizationOracle = collateralizationOracle;

        collateralizationOracle = _newCollateralizationOracle;

        emit CollateralizationOracleUpdate(
            msg.sender,
            _oldCollateralizationOracle,
            _newCollateralizationOracle
        );
    }

    /// @notice set the deviation threshold in basis points, used to detect if the
    /// cached value deviated significantly from the actual fresh readings.
    /// @param _newDeviationThresholdBasisPoints the new value to set.
    function setDeviationThresholdBasisPoints(uint256 _newDeviationThresholdBasisPoints) external override onlyGovernorOrAdmin {
        require(_newDeviationThresholdBasisPoints > 0 && _newDeviationThresholdBasisPoints <= 10_000, "CollateralizationOracleWrapper: invalid basis points");
        uint256 _oldDeviationThresholdBasisPoints = deviationThresholdBasisPoints;

        deviationThresholdBasisPoints = _newDeviationThresholdBasisPoints;

        emit DeviationThresholdUpdate(
            msg.sender,
            _oldDeviationThresholdBasisPoints,
            _newDeviationThresholdBasisPoints
        );
    }

    /// @notice set the validity duration of the cached collateralization values.
    /// @param _validityDuration the new validity duration
    /// This function will emit a DurationUpdate event from Timed.sol
    function setValidityDuration(uint256 _validityDuration) external override onlyGovernorOrAdmin {
        _setDuration(_validityDuration);
    }

    /// @notice set the readPauseOverride flag
    /// @param _readPauseOverride the new flag for readPauseOverride
    function setReadPauseOverride(bool _readPauseOverride) external override onlyGuardianOrGovernor {
        readPauseOverride = _readPauseOverride;
        emit ReadPauseOverrideUpdate(_readPauseOverride);
    }

    /// @notice governor or admin override to directly write to the cache
    /// @dev used in emergencies where the underlying oracle is compromised or failing
    function setCache(
        uint256 _cachedProtocolControlledValue,
        uint256 _cachedUserCirculatingFei,
        int256 _cachedProtocolEquity
    ) external override onlyGovernorOrAdmin {
        _setCache(_cachedProtocolControlledValue, _cachedUserCirculatingFei, _cachedProtocolEquity);
    }

    // ----------- IOracle override methods ------------------------------------
    /// @notice update reading of the CollateralizationOracle
    function update() external override whenNotPaused {
        _update();
    }

    /** 
        @notice this method reverts if the oracle is not outdated
        It is useful if the caller is incentivized for calling only when the deviation threshold or frequency has passed
    */ 
    function updateIfOutdated() external override whenNotPaused {
        require(_update(), "CollateralizationOracleWrapper: not outdated");
    }

    // returns true if the oracle was outdated at update time
    function _update() internal returns (bool) {
        bool outdated = isOutdated();

        // fetch a fresh round of information
        (
            uint256 _protocolControlledValue,
            uint256 _userCirculatingFei,
            int256 _protocolEquity,
            bool _validityStatus
        ) = ICollateralizationOracle(collateralizationOracle).pcvStats();

        outdated = outdated 
            || _isExceededDeviationThreshold(cachedProtocolControlledValue, _protocolControlledValue)
            || _isExceededDeviationThreshold(cachedUserCirculatingFei, _userCirculatingFei);
        
        // only update if valid
        require(_validityStatus, "CollateralizationOracleWrapper: CollateralizationOracle is invalid");

        _setCache(_protocolControlledValue, _userCirculatingFei, _protocolEquity);

        return outdated;
    }

    function _setCache(
        uint256 _cachedProtocolControlledValue,
        uint256 _cachedUserCirculatingFei,
        int256 _cachedProtocolEquity
    ) internal {
        // set cache variables
        cachedProtocolControlledValue = _cachedProtocolControlledValue;
        cachedUserCirculatingFei = _cachedUserCirculatingFei;
        cachedProtocolEquity = _cachedProtocolEquity;

        // reset time
        _initTimed();

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
        return isTimeEnded();
    }

    /// @notice Get the current collateralization ratio of the protocol, from cache.
    /// @return collateralRatio the current collateral ratio of the protocol.
    /// @return validityStatus the current oracle validity status (false if any
    ///         of the oracles for tokens held in the PCV are invalid, or if
    ///         this contract is paused).
    function read() external view override returns (Decimal.D256 memory collateralRatio, bool validityStatus) {
        collateralRatio = Decimal.ratio(cachedProtocolControlledValue, cachedUserCirculatingFei);
        validityStatus = _readNotPaused() && !isOutdated();
    }

    // ----------- Wrapper-specific methods ------------------------------------
    // @notice returns true if the cached values are obsolete, i.e. the actual CR
    //         readings deviated from cached value by more than a threshold.
    //         This function is intended to be called off-chain by keepers.
    //         If executed on-chain, it consumes more gas than an actual update()
    //         call _and_ does not persist the read values in the cached state.
    function isExceededDeviationThreshold() public view override returns (bool obsolete) {
        (
            uint256 _protocolControlledValue,
            uint256 _userCirculatingFei,
            , // int256 _protocolEquity,
            bool _validityStatus
        ) = ICollateralizationOracle(collateralizationOracle).pcvStats();

        require(_validityStatus, "CollateralizationOracleWrapper: CollateralizationOracle reading is invalid");

        return _isExceededDeviationThreshold(cachedProtocolControlledValue, _protocolControlledValue)
            || _isExceededDeviationThreshold(cachedUserCirculatingFei, _userCirculatingFei);
    }

    function _isExceededDeviationThreshold(uint256 cached, uint256 current) internal view returns (bool) {
        uint256 delta = current > cached ? current- cached : cached - current;
        uint256 deviationBaisPoints = delta * Constants.BASIS_POINTS_GRANULARITY / current;
        return deviationBaisPoints > deviationThresholdBasisPoints;
    }

    // @notice returns true if the cached values are obsolete or outdated, i.e.
    //         the reading is too old, or the actual CR readings deviated from cached
    //         value by more than a threshold.
    //         This function is intended to be called off-chain by keepers, to
    //         know if they should call the update() function. If executed on-chain,
    //         it consumes more gas than an actual update() + read() call _and_
    //         does not persist the read values in the cached state.
    function isOutdatedOrExceededDeviationThreshold() external view override returns (bool) {
        return isOutdated() || isExceededDeviationThreshold();
    }

    // ----------- ICollateralizationOracle override methods -------------------

    /// @notice returns the Protocol-Controlled Value, User-circulating FEI, and
    ///         Protocol Equity. If there is a fresh cached value, return it.
    ///         Otherwise, call the CollateralizationOracle to get fresh data.
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
        validityStatus = _readNotPaused() && !isOutdated();
        protocolControlledValue = cachedProtocolControlledValue;
        userCirculatingFei = cachedUserCirculatingFei;
        protocolEquity = cachedProtocolEquity;
    }

    /// @notice returns true if the protocol is overcollateralized. Overcollateralization
    ///         is defined as the protocol having more assets in its PCV (Protocol
    ///         Controlled Value) than the circulating (user-owned) FEI, i.e.
    ///         a positive Protocol Equity.
    function isOvercollateralized() external override view returns (bool) {
        require(!isOutdated(), "CollateralizationOracleWrapper: cache is outdated");
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
    function pcvStatsCurrent() external view override returns (
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

      validityStatus = fetchedValidityStatus && _readNotPaused();
    }

    function _readNotPaused() internal view returns(bool) {
        return readPauseOverride || !paused();
    }
}
