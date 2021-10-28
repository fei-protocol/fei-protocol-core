pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";
import "./IPriceBoundPSM.sol";
import "../Constants.sol";

/// @notice contract to create a DAI PSM
contract PriceBoundPSM is PegStabilityModule, IPriceBoundPSM {
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;
    using SafeCast for *;

    uint256 constant public bpDelta = 200;

    /// @notice the minimum acceptable oracle price floor is 98 cents
    uint256 public floor = Constants.BASIS_POINTS_GRANULARITY - bpDelta;

    /// @notice the maximum acceptable oracle price ceiling is $1 and 2 cents
    uint256 public ceiling = Constants.BASIS_POINTS_GRANULARITY + bpDelta;

    constructor(
        address _coreAddress,
        address _oracleAddress,
        address _backupOracle,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        int256 _decimalsNormalizer,
        bool _doInvert,
        IERC20 _token,
        IPCVDeposit _target
    ) PegStabilityModule(
        _coreAddress,
        _oracleAddress,
        _backupOracle,
        _mintFeeBasisPoints,
        _redeemFeeBasisPoints,
        _reservesThreshold,
        _feiLimitPerSecond,
        _mintingBufferCap,
        _decimalsNormalizer,
        _doInvert,
        _token,
        _target
    ) {}

    function setOracleFloor(uint256 newFloor) external override onlyGovernorOrAdmin {
        _setFloor(newFloor);
    }

    function setOracleCeiling(uint256 newCeiling) external override onlyGovernorOrAdmin {
        _setCeiling(newCeiling);
    }

    function _setCeiling(uint256 newCeiling) internal {
        require(newCeiling != 0, "PegStabilityModule: invalid ceiling");
        require(
            Decimal.ratio(newCeiling, Constants.BASIS_POINTS_GRANULARITY)
                .greaterThan(Decimal.ratio(floor, Constants.BASIS_POINTS_GRANULARITY)),
            "PegStabilityModule: ceiling must be greater than floor"
        );
        uint256 oldCeiling = ceiling;
        ceiling = newCeiling;

        emit OracleCeilingUpdate(oldCeiling, ceiling);
    }

    function _setFloor(uint256 newFloor) internal {
        require(newFloor != 0, "PegStabilityModule: invalid floor");
        require(
            Decimal.ratio(newFloor, Constants.BASIS_POINTS_GRANULARITY)
                .lessThan(Decimal.ratio(ceiling, Constants.BASIS_POINTS_GRANULARITY)),
            "PegStabilityModule: floor must be less than ceiling"
        );
        uint256 oldFloor = floor;
        floor = newFloor;

        emit OracleFloorUpdate(oldFloor, floor);
    }

    /// @notice helper function to determine if price is within a valid range
    function _validPrice(Decimal.D256 memory price) internal view returns (bool valid) {
        valid = price.greaterThan(Decimal.ratio(floor, Constants.BASIS_POINTS_GRANULARITY))
            && price.lessThan(Decimal.ratio(ceiling, Constants.BASIS_POINTS_GRANULARITY));
    }

    function _validatePriceRange(Decimal.D256 memory price) internal view override {
        require(_validPrice(price), "PegStabilityModule: price out of bounds");
    }
}
