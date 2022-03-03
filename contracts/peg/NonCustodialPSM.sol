// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IPCVDeposit} from "./../pcv/IPCVDeposit.sol";
import {PegStabilityModule} from "./PegStabilityModule.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @notice Peg Stability Module that holds no funds.
/// On a mint, it transfers all proceeds to a PCV Deposit and then deposits them into the deposit's target
/// When funds are needed for a redemption, they are simply pulled from the PCV Deposit
contract NonCustodialPSM is PegStabilityModule {
    using SafeERC20 for IERC20;

    /// @notice constructor
    /// @param params PSM constructor parameter struct
    /// @param multiRateLimitedParams params for multi rate limited
    /// @param psmParams params for PSM setup
    constructor(
        OracleParams memory params,
        MultiRateLimitedParams memory multiRateLimitedParams,
        PSMParams memory psmParams
    ) PegStabilityModule(params, multiRateLimitedParams, psmParams) {}

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
