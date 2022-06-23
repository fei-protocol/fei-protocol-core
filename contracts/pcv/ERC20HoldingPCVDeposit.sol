// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {PCVDeposit} from "./PCVDeposit.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title ERC20HoldingPCVDeposit
/// @notice PCVDeposit that is used to hold ERC20 tokens as a safe harbour. Deposit is a no-op
contract ERC20HoldingPCVDeposit is PCVDeposit {
    /// @notice Token which the balance is reported in
    IERC20 immutable token;

    constructor(address _core, IERC20 _token) CoreRef(_core) {
        token = _token;
    }

    /// @notice Empty receive function to receive ETH
    receive() external payable {}

    ///////   READ-ONLY Methods /////////////

    /// @notice returns total balance of PCV in the Deposit
    function balance() public view override returns (uint256) {
        return token.balanceOf(address(this));
    }

    /// @notice returns the resistant balance and FEI in the deposit
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        uint256 resistantBalance = balance();
        uint256 feiBalance = 0;
        return (resistantBalance, feiBalance);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return address(token);
    }

    /// @notice No-op deposit
    function deposit() external override whenNotPaused {}

    /// @notice No-op withdraw method withdraw method
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying) external override onlyPCVController whenNotPaused {}
}
