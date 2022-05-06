// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {PodExecutor} from "../../../pods/PodExecutor.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";

contract PodExecutorTest is DSTest {
    FeiTestAddresses addresses;
    Core core;
    PodExecutor podExecutor;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        addresses = getAddresses();
        core = getCore();
        podExecutor = new PodExecutor(address(core));

        vm.startPrank(addresses.governorAddress);
        core.createRole(TribeRoles.GOVERNOR, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.GOVERNOR, addresses.governorAddress);
        vm.stopPrank();
    }

    /// @notice Validate initial state of roleCreator
    function testCanPause() public {
        vm.prank(addresses.governorAddress);
        podExecutor.pause();

        vm.expectRevert(bytes("Pausable: paused"));
        podExecutor.execute(address(1), address(2), uint256(3), bytes("0x4"), bytes32(0), bytes32("0x123"));
    }

    /// @notice Validate that only an authenticated address can pause
    function testOnlyAuthedAddressCanPause() public {
        vm.expectRevert(bytes("CoreRef: Caller is not a guardian or governor"));
        podExecutor.pause();
    }
}
