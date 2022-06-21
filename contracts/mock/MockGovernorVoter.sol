// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockCoreRef.sol";
import "../metagov/utils/GovernorVoter.sol";

contract MockGovernorVoter is GovernorVoter, MockCoreRef {
    constructor(address core) MockCoreRef(core) GovernorVoter() {}
}
