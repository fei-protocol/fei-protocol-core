// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVDeposit.sol";

/// @title a PCV Deposit interface for Fei V2
/// @author eswak
interface IPCVDepositV2 is IPCVDeposit {
    // ----------- Getters -----------

    // gets the token address in which this deposit returns its balance
    function balanceReportedIn() external view returns (address);

    // gets the resistant token balance and protocol owned fei of this deposit
    function balanceAndFei() external view returns (uint256, uint256);
}
