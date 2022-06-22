// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./MockERC20.sol";

/// @title Aave PCV Deposit
/// @author Fei Protocol
contract MockLendingPool {
    MockERC20 public aToken;

    constructor() {
        aToken = new MockERC20();
    }

    function deposit(
        address asset,
        uint256 amount,
        address onBehalfOf,
        uint16 referralCode
    ) external {
        IERC20(asset).transferFrom(msg.sender, address(this), amount);
        aToken.mint(onBehalfOf, amount);
    }

    function withdraw(
        address asset,
        uint256 amount,
        address to
    ) external {
        aToken.approveOverride(msg.sender, address(this), amount);
        aToken.burnFrom(msg.sender, amount);

        IERC20(asset).transfer(to, amount);
    }
}
