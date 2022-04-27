// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.10;

import "../../metagov/utils/LiquidityGaugeManager.sol";
import "../IPCVDepositBalances.sol";

/// @title AngleGaugeLens
/// @author Fei Protocol
/// @notice a contract to read tokens held in a gauge.
/// Angle has a small modification in their Curve fork : they name a
/// variable staking_token() instead of lp_token() as in the original Curve code.
contract AngleGaugeLens is IPCVDepositBalances {
    /// @notice FEI token address
    address private constant FEI = 0x956F47F50A910163D8BF957Cf5846D573E7f87CA;

    /// @notice the gauge inspected
    address public immutable gaugeAddress;

    /// @notice the address of the contract staking in the gauge
    address public immutable stakerAddress;

    /// @notice the token the lens reports balances in
    address public immutable override balanceReportedIn;

    constructor(address _gaugeAddress, address _stakerAddress) {
        gaugeAddress = _gaugeAddress;
        stakerAddress = _stakerAddress;
        balanceReportedIn = ILiquidityGauge(_gaugeAddress).staking_token();
    }

    /// @notice returns the amount of tokens staked by stakerAddress in
    /// the gauge gaugeAddress.
    function balance() public view override returns (uint256) {
        return ILiquidityGauge(gaugeAddress).balanceOf(stakerAddress);
    }

    /// @notice returns the amount of tokens staked by stakerAddress in
    /// the gauge gaugeAddress.
    /// In the case where an LP token between XYZ and FEI is staked in
    /// the gauge, this lens reports the amount of LP tokens staked, not the
    /// underlying amounts of XYZ and FEI tokens held within the LP tokens.
    /// This lens can be coupled with another lens in order to compute the
    /// underlying amounts of FEI and XYZ held inside the LP tokens.
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        uint256 stakedBalance = balance();
        if (balanceReportedIn == FEI) {
            return (stakedBalance, stakedBalance);
        } else {
            return (stakedBalance, 0);
        }
    }
}
