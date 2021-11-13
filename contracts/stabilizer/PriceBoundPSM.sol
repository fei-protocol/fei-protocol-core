pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";
import "./IPriceBound.sol";
import "../Constants.sol";

/// @notice contract to create a price bound DAI PSM
/// This contract will allow swaps when the price of DAI is between 98 cents and 1.02 by default
/// These defaults are changeable by the admin and governance by calling floor and ceiling setters
/// setOracleFloor and setOracleCeiling
contract PriceBoundPSM is PegStabilityModule, IPriceBound {
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;
    using SafeCast for *;

    /// @notice the default minimum acceptable oracle price floor is 98 cents
    uint256 public override floor;

    /// @notice the default maximum acceptable oracle price ceiling is $1.02
    uint256 public override ceiling;

    /// @notice constructor
    /// @param _floor minimum acceptable oracle price
    /// @param _ceiling maximum  acceptable oracle price
    /// @param _params PSM construction params
    constructor(
        uint256 _floor,
        uint256 _ceiling,
        ConstructorParams memory _params
    ) PegStabilityModule(_params) {
        _setCeilingBasisPoints(_ceiling);
        _setFloorBasisPoints(_floor);
    }

    /// @notice sets the floor price in BP
    function setOracleFloorBasisPoints(uint256 newFloorBasisPoints) external override onlyGovernorOrAdmin {
        _setFloorBasisPoints(newFloorBasisPoints);
    }

    /// @notice sets the ceiling price in BP
    function setOracleCeilingBasisPoints(uint256 newCeilingBasisPoints) external override onlyGovernorOrAdmin {
        _setCeilingBasisPoints(newCeilingBasisPoints);
    }

    /// @notice helper function to set the ceiling in basis points
    function _setCeilingBasisPoints(uint256 newCeilingBasisPoints) internal {
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
    function _setFloorBasisPoints(uint256 newFloorBasisPoints) internal {
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