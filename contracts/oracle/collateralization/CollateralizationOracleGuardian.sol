// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ICollateralizationOracleWrapper.sol";
import "../../refs/CoreRef.sol";
import "../../utils/Timed.sol";
import "../../Constants.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/** 
    @title Fei Protocol's Collateralization Oracle Guardian
    @author Fei Protocol
    This contract needs to be granted the ORACLE_ADMIN role
    The guardian can leverage this contract to make small bounded changes to CR
    This is intended to be used only in emergencies when the base CollateralizationOracle is compromised
    The guardian should be able to approximate manual changes to CR via this contract without retaining too much power
*/
contract CollateralizationOracleGuardian is CoreRef, Timed {
    using SafeCast for uint256;

    event DeviationThresholdUpdate(
        uint256 oldDeviationThresholdBasisPoints,
        uint256 newDeviationThresholdBasisPoints
    );

    /// @notice the oracle wrapper to update
    ICollateralizationOracleWrapper public immutable oracleWrapper;

    /// @notice the maximum update size relative to current, measured in basis points (1/10000)
    uint256 public deviationThresholdBasisPoints;

    /**
        @notice The constructor for CollateralizationOracleGuardian
        @param _core the core address to reference
        @param _oracleWrapper the instance of CollateralizationOracleWrapper
        @param _frequency the maximum frequency a guardian can update the cache
        @param _deviationThresholdBasisPoints the maximum percent change in a cache value for a given update
     */
    constructor(
        address _core,
        ICollateralizationOracleWrapper _oracleWrapper,
        uint256 _frequency,
        uint256 _deviationThresholdBasisPoints
    ) CoreRef(_core) Timed(_frequency) {
        oracleWrapper = _oracleWrapper;

        _setDeviationThresholdBasisPoints(_deviationThresholdBasisPoints);

        _initTimed();
    }

    /// @notice guardian set the cache values on collateralization oracle
    /// @param protocolControlledValue new PCV value
    /// @param userCirculatingFei new user FEI value
    /// @dev make sure to pause the CR oracle wrapper or else the set value would be overwritten on next update
    function setCache(
        uint256 protocolControlledValue,
        uint256 userCirculatingFei
    ) external onlyGuardianOrGovernor afterTime {
        // Reset timer
        _initTimed();

        // Check boundaries on new update values
        uint256 cachedPCV = oracleWrapper.cachedProtocolControlledValue();
        require(
            calculateDeviationThresholdBasisPoints(
                protocolControlledValue,
                cachedPCV
            ) <= deviationThresholdBasisPoints,
            "CollateralizationOracleGuardian: Cached PCV exceeds deviation"
        );

        uint256 cachedUserFei = oracleWrapper.cachedUserCirculatingFei();
        require(
            calculateDeviationThresholdBasisPoints(
                userCirculatingFei,
                cachedUserFei
            ) <= deviationThresholdBasisPoints,
            "CollateralizationOracleGuardian: Cached User FEI exceeds deviation"
        );

        // Set the new cache values
        int256 equity = protocolControlledValue.toInt256() -
            userCirculatingFei.toInt256();
        oracleWrapper.setCache(
            protocolControlledValue,
            userCirculatingFei,
            equity
        );

        assert(oracleWrapper.cachedProtocolEquity() == equity);
    }

    /// @notice return the percent deviation between a and b in basis points terms
    function calculateDeviationThresholdBasisPoints(uint256 a, uint256 b)
        public
        pure
        returns (uint256)
    {
        uint256 delta = (a < b) ? (b - a) : (a - b);
        return (delta * Constants.BASIS_POINTS_GRANULARITY) / a;
    }

    /// @notice governance setter for maximum deviation the guardian can change per update
    function setDeviationThresholdBasisPoints(
        uint256 newDeviationThresholdBasisPoints
    ) external onlyGovernor {
        _setDeviationThresholdBasisPoints(newDeviationThresholdBasisPoints);
    }

    function _setDeviationThresholdBasisPoints(
        uint256 newDeviationThresholdBasisPoints
    ) internal {
        require(
            newDeviationThresholdBasisPoints <=
                Constants.BASIS_POINTS_GRANULARITY,
            "CollateralizationOracleGuardian: deviation exceeds granularity"
        );

        uint256 oldDeviationThresholdBasisPoints = deviationThresholdBasisPoints;
        deviationThresholdBasisPoints = newDeviationThresholdBasisPoints;

        emit DeviationThresholdUpdate(
            oldDeviationThresholdBasisPoints,
            newDeviationThresholdBasisPoints
        );
    }
}
