pragma solidity ^0.8.4;

import "./SafePSM.sol";

contract SafeCeilingPSM is SafePSM {

    /// @notice hard cap on how much external asset this psm will hold at once
    uint256 public assetCap;

    /// @notice current amount of exposure to the external asset in unit terms
    uint256 public currentExposure;

    constructor(
        uint256 _floor,
        uint256 _ceiling,
        OracleParams memory _params,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _reservesThreshold,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        IERC20 _underlyingToken,
        IPCVDeposit _surplusTarget,
        IOracle _actualPriceOracle,
        uint256 _assetCap
    ) SafePSM(
        _floor,
        _ceiling,
        _params,
        _mintFeeBasisPoints,
        _redeemFeeBasisPoints,
        _reservesThreshold,
        _feiLimitPerSecond,
        _mintingBufferCap,
        _underlyingToken,
        _surplusTarget,
        _actualPriceOracle
    ) {
        assetCap = _assetCap;
    }

    /// @notice function to update exposure in case a balance changes outside of a mint or redeem
    function updateCurrentExposure() external {
        currentExposure = underlyingToken.balanceOf(address(this));
    }

    /// @notice stop PSM from executing if price is outside of the acceptable band
    function _afterRedeemHook(uint256 amountOut) internal override virtual {
        _validatePrice();

        currentExposure -= amountOut;
    }

    /// @notice stop PSM from executing if price is outside of the acceptable band
    /// or if there this tx would cause the PSM to go over the asset cap
    function _afterMintHook(uint256 amountIn) internal override virtual {
        _validatePrice();

        currentExposure += amountIn;
        require(currentExposure <= assetCap, "SafeCeilingPSM: Asset cap reached");
    }
}
