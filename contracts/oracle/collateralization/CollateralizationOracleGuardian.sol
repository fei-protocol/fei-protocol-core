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

    event DeviationUpdate(uint256 oldDeviationBasisPoints, uint256 newDeviationBasisPoints);

    ICollateralizationOracleWrapper public immutable oracleWrapper;

    uint256 public deviationBasisPoints;
    
    constructor(
        address _core, 
        ICollateralizationOracleWrapper _oracleWrapper, 
        uint256 _frequency,
        uint256 _deviationBasisPoints
    ) CoreRef(_core) Timed(_frequency) {
        oracleWrapper = _oracleWrapper;

        _setDeviationBasisPoints(_deviationBasisPoints);

        _initTimed();
    }

    function setCache(
        uint256 protocolControlledValue, 
        uint256 userCirculatingFei
    ) external onlyGuardianOrGovernor afterTime {

        _initTimed();

        uint256 cachedPCV = oracleWrapper.cachedProtocolControlledValue();
        require(
            calculateDeviationBasisPoints(protocolControlledValue, cachedPCV) <= deviationBasisPoints,
            "CollateralizationOracleGuardian: Cached PCV exceeds deviation"
        );

        uint256 cachedUserFei = oracleWrapper.cachedUserCirculatingFei();
        require(
            calculateDeviationBasisPoints(userCirculatingFei, cachedUserFei) <= deviationBasisPoints,
            "CollateralizationOracleGuardian: Cached User FEI exceeds deviation"
        );

        int256 equity = protocolControlledValue.toInt256() - userCirculatingFei.toInt256();
        oracleWrapper.setCache(protocolControlledValue, userCirculatingFei, equity);

        assert(oracleWrapper.cachedProtocolEquity() == equity);
    }

    /// @notice return the percent deviation between a and b in basis points terms
    function calculateDeviationBasisPoints(uint256 a, uint256 b) public pure returns (uint256) {
        uint256 delta = (a < b) ? (b - a) : (a - b);
        return delta * Constants.BASIS_POINTS_GRANULARITY / a;
    }

    function setDeviationBasisPoints(uint256 newDeviationBasisPoints) external onlyGovernor {
        _setDeviationBasisPoints(newDeviationBasisPoints);
    }

    function _setDeviationBasisPoints(uint256 newDeviationBasisPoints) internal {
        require(newDeviationBasisPoints <= Constants.BASIS_POINTS_GRANULARITY, "CollateralizationOracleGuardian: deviation exceeds granularity");

        uint256 oldDeviationBasisPoints = deviationBasisPoints;
        deviationBasisPoints = newDeviationBasisPoints;

        emit DeviationUpdate(oldDeviationBasisPoints, newDeviationBasisPoints);
    }
}