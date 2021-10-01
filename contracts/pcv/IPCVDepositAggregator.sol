// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVDeposit.sol";
import "../external/Decimal.sol";

/// @title a PCV Deposit aggregation interface
/// @author Fei Protocol
interface IPCVDepositAggregator is IPCVDeposit {

    // ----------- State changing api -----------
    function rebalance() external;

    // ----------- Governor only state changing api -----------
    function addPCVDeposit() external;

    function setNewAggregator(IPCVDepositAggregator newAggregator) external;

    // ----------- Governor or Guardian only state changing api -----------
    function removePCVDeposit() external;

    // ----------- Read-only api -----------
    function rewardsAssetManager() external returns(address);

    function pcvDeposits() external view returns(IPCVDeposit[] memory);

    function percentHeld(IPCVDeposit pcvDeposit, uint256 depositAmount) external view returns(Decimal.D256 memory);

    function targetPercentHeld(IPCVDeposit pcvDeposit) external view returns(Decimal.D256 memory);

    function amountFromTarget(IPCVDeposit pcvDeposit) external view returns(int256);
}
