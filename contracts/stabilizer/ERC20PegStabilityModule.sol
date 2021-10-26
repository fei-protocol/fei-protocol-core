pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";
import "../Constants.sol";

/// @notice contract to create a DAI PSM
contract ERC20PegStabilityModule is PegStabilityModule {
    using Decimal for Decimal.D256;
    using SafeERC20 for IERC20;
    using SafeCast for *;

    /// @notice the minimum acceptable oracle price
    Decimal.D256 public floor;

    /// @notice the maximum acceptable oracle price
    Decimal.D256 public ceiling;

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
    ) {
        floor = Decimal.ratio(9800, Constants.BASIS_POINTS_GRANULARITY);
        ceiling = Decimal.ratio(10200, Constants.BASIS_POINTS_GRANULARITY);
    }

    function setOracleFloor(uint256 newFloor) external onlyGovernorOrAdmin {
        _setFloor(newFloor);
    }

    function setOracleCeiling(uint256 newCeiling) external onlyGovernorOrAdmin {
        _setCeiling(newCeiling);
    }

    function _setCeiling(uint256 newCeiling) internal {
        ceiling = Decimal.ratio(newCeiling, Constants.BASIS_POINTS_GRANULARITY);
    }

    function _setFloor(uint256 newFloor) internal {
        require(newFloor > 0, "PegStabilityModule: invalid floor");
        floor = Decimal.ratio(newFloor, Constants.BASIS_POINTS_GRANULARITY);
    }

    /// @notice msg.value should always be 0 as this class only accepts ERC20 tokens as payment
    function _checkMsgValue(uint256) internal override {
        require(msg.value == 0, "PegStabilityModule: cannot send eth to mint");
    }

    /// @notice ERC20 PSM so all transfers require sending tokens
    function _transfer(address to, uint256 amount) internal override {
        SafeERC20.safeTransfer(token, to, amount);
    }

    /// @notice ERC20PSM override the hook and pull tokens to this contract
    function _transferFrom(address from, address to, uint256 amount) internal override {
        SafeERC20.safeTransferFrom(IERC20(token), from, to, amount);
    }

    /// @notice helper function to determine if price is within a valid range
    function _validPrice(Decimal.D256 memory price) internal view returns (bool valid) {
        valid = price.greaterThan(floor) && price.lessThan(ceiling);
    }

    function _validatePriceRange(Decimal.D256 memory price) internal view override {
        require(_validPrice(price), "PegStabilityModule: price out of bounds");
    }
}
