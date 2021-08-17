// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";

contract MockTribe is MockERC20 {
    function delegate(address account) external {}
}
