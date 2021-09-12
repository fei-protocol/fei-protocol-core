// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

/// @title a PCV Deposit interface for only balance getters
/// @author Fei Protocol
interface IPCVDepositBalances {
    
    // ----------- Getters -----------

    function balance() external view returns (uint256);

    // gets the token address in which this deposit returns its balance
    function balanceReportedIn() external view returns (address);

    // gets the resistant token balance and protocol owned fei of this deposit
    function resistantBalanceAndFei() external view returns (uint256, uint256);
}
