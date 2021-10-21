pragma solidity ^0.8.4;

import "./PegStabilityModule.sol";

/// @notice contract to create a DAI PSM
contract ERC20PegStabilityModule is PegStabilityModule {
    using SafeERC20 for IERC20;

    constructor(
        address _coreAddress,
        address _oracleAddress,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        int256 _decimalsNormalizer,
        bool _doInvert,
        IERC20 _token,
        IFei _FEI
    ) PegStabilityModule(
        _coreAddress,
        _oracleAddress,
        _mintFeeBasisPoints,
        _redeemFeeBasisPoints,
        _reservesThreshold,
        _feiLimitPerSecond,
        _mintingBufferCap,
        _decimalsNormalizer,
        _doInvert,
        _token,
        _FEI
    ) {}

    function allocateSurplus() external override {
        require(reservesSurplus() > 0, "EthPegStabilityModule: No surplus to allocate");
        /// @TODO figure out what to do here
    }

    /// @notice TODO figure out how and if this contract should handle deposits
    function deposit() external override {
        revert("no-op");
    }

    /// @notice withdraw assets from ERC20 PSM to an external address
    function withdraw(address to, uint256 amount) external override onlyPCVController {
        _withdrawERC20(address(token), to, amount);
    }
}
