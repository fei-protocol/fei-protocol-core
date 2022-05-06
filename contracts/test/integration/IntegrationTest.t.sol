// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../utils/DSTest.sol";
import {StdLib} from "../utils/StdLib.sol";

// Note: IntegrationTest contracts must contain IntegrationTest in the name
// in order for the test runner to identify it as an integration test
contract IntegrationTest is DSTest, StdLib {
    function setUp() public {}

    function testPass() public {}
}
