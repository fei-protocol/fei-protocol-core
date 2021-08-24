// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVDeposit.sol";

/// @title a PCV Deposit interface for Fei V2
/// @author eswak
interface IPCVDepositV2 is IPCVDeposit {
    // ----------- Getters -----------

    function balanceReportedIn() external view returns (address);

    function resistantBalance() external view returns (uint256);
    function resistantProtocolOwnedFei() external view returns (uint256);
}
