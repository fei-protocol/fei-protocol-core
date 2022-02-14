// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockCoreRef.sol";
import "../metagov/utils/LiquidityGaugeManager.sol";

contract MockLiquidityGaugeManager is LiquidityGaugeManager, MockCoreRef {
    constructor(address core, address gaugeController) MockCoreRef(core) LiquidityGaugeManager(gaugeController) {}
}
