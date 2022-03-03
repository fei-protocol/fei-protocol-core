// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {PodManager} from "../../../pods/PodManager.sol";
import {IOptimisticTimelock} from "../../../dao/timelock/IOptimisticTimelock.sol";
import {IControllerV1} from "../../../pods/interfaces/IControllerV1.sol";

import {DSTest} from "../../utils/DSTest.sol";
import {mintOrcaTokens, podParams} from "../fixtures/Orca.sol";
import {Vm} from "../../utils/Vm.sol";
import "hardhat/console.sol";

/// @notice Validate PodManager critical functionality such as
/// creating pods
///  @dev Admin pod can not also be a pod member
contract PodManagerIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodManager manager;
    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private podController = 0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberToken = 0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;
    address private podAdmin = address(0x3);

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    function setUp() public {
        manager = new PodManager(core, podAdmin, podController, memberToken);
        mintOrcaTokens(address(manager), 2, vm);
    }

    /// @notice Validate that a non-pod admin can not create a pod
    function testOnlyAdminCanCreatePod() public {
        (
            address[] memory members,
            uint256 threshold,
            bytes32 podLabel,
            string memory ensString,
            string memory imageUrl,
            uint256 minDelay
        ) = podParams();

        vm.expectRevert(bytes("Only PodAdmin can deploy"));
        manager.createChildOptimisticPod(
            members,
            threshold,
            podLabel,
            ensString,
            imageUrl,
            minDelay
        );
    }

    /// @notice Creates a child pod with an optimistic timelock attached
    function testDeployOptimisticGovernancePod() public {
        (
            address[] memory members,
            uint256 threshold,
            bytes32 podLabel,
            string memory ensString,
            string memory imageUrl,
            uint256 minDelay
        ) = podParams();

        vm.prank(podAdmin);
        (uint256 podId, address timelock) = manager.createChildOptimisticPod(
            members,
            threshold,
            podLabel,
            ensString,
            imageUrl,
            minDelay
        );
        require(timelock != address(0));

        address safeAddress = manager.getPodSafe(podId);
        IOptimisticTimelock timelockContract = IOptimisticTimelock(timelock);
        // Gnosis safe should be the proposer
        bool hasProposerRole = timelockContract.hasRole(
            PROPOSER_ROLE,
            safeAddress
        );
        assertTrue(hasProposerRole);

        bool hasExecutorRole = timelockContract.hasRole(
            EXECUTOR_ROLE,
            safeAddress
        );
        assertTrue(hasExecutorRole);
    }

    /// @notice Validate that the podId to timelock mapping is correct
    function testTimelockStorageOnDeploy() public {
        (
            address[] memory members,
            uint256 threshold,
            bytes32 podLabel,
            string memory ensString,
            string memory imageUrl,
            uint256 minDelay
        ) = podParams();

        vm.prank(podAdmin);
        (uint256 podId, address timelock) = manager.createChildOptimisticPod(
            members,
            threshold,
            podLabel,
            ensString,
            imageUrl,
            minDelay
        );

        assertEq(timelock, manager.getPodTimelock(podId));
    }

    /// @notice Validate that multiple pods can be deployed with the correct admin set
    function testDeployMultiplePodsWithAdmin() public {
        (
            address[] memory members,
            uint256 threshold,
            ,
            string memory ensString,
            string memory imageUrl,
            uint256 minDelay
        ) = podParams();

        vm.prank(podAdmin);
        (uint256 podAId, ) = manager.createChildOptimisticPod(
            members,
            threshold,
            bytes32("A"),
            ensString,
            imageUrl,
            minDelay
        );

        address podAAdmin = IControllerV1(podController).podAdmin(podAId);
        assertEq(podAAdmin, podAdmin);

        vm.prank(podAdmin);
        (uint256 podBId, ) = manager.createChildOptimisticPod(
            members,
            threshold,
            bytes32("B"),
            ensString,
            imageUrl,
            minDelay
        );

        assertEq(podBId, podAId + 1);
        address podBAdmin = IControllerV1(podController).podAdmin(podBId);
        assertEq(podBAdmin, podAdmin);
    }
}
