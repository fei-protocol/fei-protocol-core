// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IPCVDeposit} from "./../pcv/IPCVDeposit.sol";
import {FixedPricePSM} from "./FixedPricePSM.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Peg Stability Module that holds no funds.
/// On a mint, it transfers all proceeds to a PCV Deposit and then deposits them into the deposit's target
/// When funds are needed for a redemption, they are simply pulled from the PCV Deposit
contract PegStabilityModuleNonCustodial is FixedPricePSM {
    using SafeERC20 for IERC20;

    /// @notice constructor
    /// @param _floor minimum acceptable orace price in basis points
    /// @param _ceiling maximum acceptable orace price in basis points
    /// @param params PSM constructor parameter struct
    /// @param _mintFeeBasisPoints fee for minting in basis points
    /// @param _redeemFeeBasisPoints fee for redemption in basis points
    /// @param _feiLimitPerSecond the amount of FEI that will be replenished every second on the buffer
    /// @param _mintingBufferCap cap on minting buffer
    /// @param _underlyingToken underlying token this PSM trades against
    /// @param _pcvDeposit where all assets are stored and all assets are pulled from
    constructor(
        uint256 _floor,
        uint256 _ceiling,
        OracleParams memory params,
        uint256 _mintFeeBasisPoints,
        uint256 _redeemFeeBasisPoints,
        uint256 _feiLimitPerSecond,
        uint256 _mintingBufferCap,
        IERC20 _underlyingToken,
        IPCVDeposit _pcvDeposit
    )
        FixedPricePSM(
            _floor,
            _ceiling,
            params,
            _mintFeeBasisPoints,
            _redeemFeeBasisPoints,
            0, /// hardcode reserve threshold to 0
            _feiLimitPerSecond,
            _mintingBufferCap,
            _underlyingToken,
            _pcvDeposit
        )
    {}

    /// @notice reusable function that sends all tokens to the PCV Deposit
    /// and then has the PCV Deposit allocate those tokens
    function _allocateTokens() internal {
        uint256 currentBalance = balance();
        require(
            currentBalance != 0,
            "PegStabilityModule: No balance to allocate"
        );

        underlyingToken.safeTransfer(address(surplusTarget), currentBalance);
        surplusTarget.deposit();
    }

    /// @notice send any surplus reserves to the PCV allocation
    function allocateSurplus() external override {
        _allocateTokens();
    }

    /// @notice function to receive ERC20 tokens from external contracts
    function deposit() external override {
        _allocateTokens();
    }

    /// @notice set reserves threshold to 0 as this contract will hold no
    /// underlying tokens and will instead forward to the PCV Deposit
    function _setReservesThreshold(uint256) internal override {
        reservesThreshold = 0;

        emit ReservesThresholdUpdate(0, 0);
    }

    /// @notice transfer ERC20 token to the recipient from the PCV Deposit
    /// @param to recipient address
    /// @param amount number of tokens sent to recipient
    function _transfer(address to, uint256 amount) internal override {
        surplusTarget.withdraw(to, amount);
    }

    /// @notice transfer assets from user to this contract
    /// @param from sending address
    /// @param amount number of tokens sent to PCV Deposit
    function _transferFrom(
        address from,
        address,
        uint256 amount
    ) internal override {
        underlyingToken.safeTransferFrom(from, address(surplusTarget), amount);
        surplusTarget.deposit();
    }
}
