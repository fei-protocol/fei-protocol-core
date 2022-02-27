// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockOracle.sol";
import "./MockCoreRef.sol";

contract MockOracleCoreRef is MockOracle, MockCoreRef {
    constructor(address core, uint256 usdPerEth)
        MockCoreRef(core)
        MockOracle(usdPerEth)
    {}
}
