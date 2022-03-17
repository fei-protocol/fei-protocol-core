// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {VetoController} from "../../../pods/VetoController.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {Core} from "../../../core/Core.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";
import {ITimelock} from "../../../dao/timelock/ITimelock.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {mintOrcaTokens, getPodParams} from "../fixtures/Orca.sol";

contract VetoControllerIntegrationTest is DSTest {
    uint256 podId;
    address timelock;
    VetoController vetoController;
    IPodFactory podFactory;

    address private podAdmin = address(0x11);
    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private feiDAOTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;
    address private podController = 0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberToken = 0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        // 1. Deploy podFactory
        address podExecutor = address(0x10);
        podFactory = new PodFactory(
            core,
            podController,
            memberToken,
            podExecutor
        );
        mintOrcaTokens(address(podFactory), 2, vm);

        // 2. Deploy VetoController
        vetoController = new VetoController(core, address(podFactory));

        // 3. Create a pod, which has the vetoController as a proposer
        IPodFactory.PodConfig memory podConfig = getPodParams(
            podAdmin,
            address(vetoController)
        );

        vm.prank(feiDAOTimelock);
        (podId, timelock) = podFactory.createChildOptimisticPod(podConfig);
    }

    function testInitialState() public {
        bytes32[] memory vetoTribeRoles = vetoController.getPodVetoRoles(0);
        assertEq(vetoTribeRoles.length, 0);

        // Validate VetoController has proposer role, this will allow it to veto
        ITimelock timelockContract = ITimelock(timelock);
        bool hasProposerRole = timelockContract.hasRole(
            keccak256("PROPOSER_ROLE"),
            address(vetoController)
        );
        assertTrue(hasProposerRole);
    }

    function testGrantVetoPermission() public {
        bytes32 roleToGrant = keccak256("TEST_ROLE");

        vm.prank(feiDAOTimelock);
        vetoController.grantVetoPermission(podId, roleToGrant);

        bytes32[] memory vetoTribeRoles = vetoController.getPodVetoRoles(podId);
        assertEq(vetoTribeRoles.length, 1);
        assertEq(vetoTribeRoles[0], roleToGrant);
    }

    function testRevokeVetoPermission() public {
        bytes32 roleToGrant = keccak256("TEST_ROLE");

        vm.prank(feiDAOTimelock);
        vetoController.grantVetoPermission(podId, roleToGrant);

        // Revoke granted role
        vm.prank(feiDAOTimelock);
        vetoController.revokeVetoPermission(podId, roleToGrant);

        bytes32[] memory vetoTribeRoles = vetoController.getPodVetoRoles(podId);
        assertEq(vetoTribeRoles.length, 0);
    }

    /// @notice Validate that can cancel a transaction proposed on a pod timelock, to which an address
    ///         has been granted veto power
    function testCancel() public {
        // 1. Create test role and grant to a testAddress
        bytes32 testRole = keccak256("TEST_ROLE");
        address testAddress = address(0x12);

        vm.startPrank(feiDAOTimelock);
        Core(core).createRole(testRole, TribeRoles.GOVERNOR);
        Core(core).grantRole(testRole, testAddress);
        vm.stopPrank();

        // 2. Grant test role veto power on this pod
        vm.prank(feiDAOTimelock);
        vetoController.grantVetoPermission(podId, testRole);

        // 3. Validate that it can call veto
        bytes32 proposalId = bytes32("0x1");
        vm.startPrank(testAddress);
        vm.expectRevert(
            bytes("TimelockController: operation cannot be cancelled")
        );
        vetoController.veto(podId, proposalId);
        vm.stopPrank();
    }

    /// @notice Validate that an attempt to cancel a transaction from a non-authorised address fails
    function testCancelFailsForNonAuth() public {
        address testAddress = address(0x12);
        bytes32 proposalId = bytes32("0x1");

        vm.startPrank(testAddress);
        vm.expectRevert(bytes("UNAUTHORISED_VETO"));
        vetoController.veto(podId, proposalId);
        vm.stopPrank();
    }
}
