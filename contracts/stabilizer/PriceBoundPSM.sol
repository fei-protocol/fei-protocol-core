pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";
import "./IPriceBoundPSM.sol";
import "../Constants.sol";

/// @notice contract to create a price bound DAI PSM
/// This contract will allow swaps when the price of DAI is between 98 cents and 1.02 by default
/// These defaults are changeable by the admin and governance by calling floor and ceiling setters
/// setOracleFloor and setOracleCeiling
contract PriceBoundPSM is PegStabilityModule, IPriceBoundPSM {
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;
    using SafeCast for *;

    /// @notice get the basis points delta
    uint256 constant public override bpDelta = 200;

    /// @notice the default minimum acceptable oracle price floor is 98 cents
    uint256 public override floor = Constants.BASIS_POINTS_GRANULARITY - bpDelta;

    /// @notice the default maximum acceptable oracle price ceiling is $1.02
    uint256 public override ceiling = Constants.BASIS_POINTS_GRANULARITY + bpDelta;

    /// @notice constructor
    /// @param _coreAddress Fei core to reference
    /// @param _oracleAddress Price oracle to reference
    /// @param _backupOracle Backup price oracle to reference
    /// @param _mintFeeBasisPoints fee in basis points to buy Fei
    /// @param _redeemFeeBasisPoints fee in basis points to sell Fei
    /// @param _reservesThreshold amount of tokens to hold in this contract
    /// @param _feiLimitPerSecond must be less than or equal to 10,000 fei per second
    /// @param _mintingBufferCap cap of buffer that can be used at once
    /// @param _decimalsNormalizer normalize decimals in oracle if tokens have different decimals
    /// @param _doInvert invert oracle price if true
    /// @param _token token to buy and sell against Fei
    /// @param _target Fei token to reference
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

    /// @notice sets the floor price in BP
    function setOracleFloor(uint256 newFloorBasisPoints) external override onlyGovernorOrAdmin {
        _setFloor(newFloorBasisPoints);
    }

    /// @notice sets the ceiling price in BP
    function setOracleCeiling(uint256 newCeilingBasisPoints) external override onlyGovernorOrAdmin {
        _setCeiling(newCeilingBasisPoints);
    }

    /// @notice helper function to set the ceiling in basis points
    function _setCeiling(uint256 newCeilingBasisPoints) internal {
        require(newCeilingBasisPoints != 0, "PegStabilityModule: invalid ceiling");
        require(
            Decimal.ratio(newCeilingBasisPoints, Constants.BASIS_POINTS_GRANULARITY)
                .greaterThan(Decimal.ratio(floor, Constants.BASIS_POINTS_GRANULARITY)),
            "PegStabilityModule: ceiling must be greater than floor"
        );
        uint256 oldCeiling = ceiling;
        ceiling = newCeilingBasisPoints;

        emit OracleCeilingUpdate(oldCeiling, ceiling);
    }

    /// @notice helper function to set the floor in basis points
    function _setFloor(uint256 newFloorBasisPoints) internal {
        require(newFloorBasisPoints != 0, "PegStabilityModule: invalid floor");
        require(
            Decimal.ratio(newFloorBasisPoints, Constants.BASIS_POINTS_GRANULARITY)
                .lessThan(Decimal.ratio(ceiling, Constants.BASIS_POINTS_GRANULARITY)),
            "PegStabilityModule: floor must be less than ceiling"
        );
        uint256 oldFloor = floor;
        floor = newFloorBasisPoints;

        emit OracleFloorUpdate(oldFloor, floor);
    }

    /// @notice helper function to determine if price is within a valid range
    function _validPrice(Decimal.D256 memory price) internal view returns (bool valid) {
        valid = price.greaterThan(Decimal.ratio(floor, Constants.BASIS_POINTS_GRANULARITY))
            && price.lessThan(Decimal.ratio(ceiling, Constants.BASIS_POINTS_GRANULARITY));
    }

    /// @notice reverts if the price is greater than or equal to the ceiling or less than or equal to the floor
    function _validatePriceRange(Decimal.D256 memory price) internal view override {
        require(_validPrice(price), "PegStabilityModule: price out of bounds");
    }
}
