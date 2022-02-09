// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;  

import "../../metagov/utils/LiquidityGaugeManager.sol";
import "../IPCVDepositBalances.sol";

/// @title GaugeLens
/// @author Fei Protocol
/// @notice a contract to read tokens held in a gauge
contract GaugeLens is IPCVDepositBalances {

    /// @notice the gauge inspected
    address public immutable gaugeAddress;

    /// @notice the address of the contract staking in the gauge
    address public immutable stakerAddress;

    /// @notice the token the lens reports balances in
    address public immutable override balanceReportedIn;

    constructor(
        address _gaugeAddress, 
        address _stakerAddress
    ) {
        gaugeAddress = _gaugeAddress;
        stakerAddress = _stakerAddress;
        balanceReportedIn = ILiquidityGauge(_gaugeAddress).staking_token();
    }

    function balance() public view override returns(uint256) {
        return ILiquidityGauge(gaugeAddress).balanceOf(stakerAddress);
    }

    function resistantBalanceAndFei() public view override returns(uint256, uint256) {
        return (balance(), 0);
    }
}
