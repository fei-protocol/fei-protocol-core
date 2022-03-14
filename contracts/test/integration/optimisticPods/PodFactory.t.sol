// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {PodFactory} from "../../../pods/PodFactory.sol";
import {PodExecutor} from "../../../pods/PodExecutor.sol";
import {ITimelock} from "../../../dao/timelock/ITimelock.sol";
import {IControllerV1} from "../../../pods/orcaInterfaces/IControllerV1.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";

import {DSTest} from "../../utils/DSTest.sol";
import {mintOrcaTokens, getPodParams} from "../fixtures/Orca.sol";
import {Vm} from "../../utils/Vm.sol";
import "hardhat/console.sol";

/// @notice Validate PodFactory critical functionality such as creating pods
///  @dev PodAdmin can not also be a pod member
contract PodFactoryIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    PodExecutor podExecutor;
    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private podController = 0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberToken = 0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;
    address private podAdmin = address(0x3);
    address private feiDAOTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    function setUp() public {
        podExecutor = new PodExecutor();
        factory = new PodFactory(
            core,
            podController,
            memberToken,
            address(podExecutor)
        );
        mintOrcaTokens(address(factory), 2, vm);
    }

    /// @notice Validate that a non-pod feiDAOTimelock can not create a pod
    function testOnlyDesignatedUsersCanCreatePod() public {
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(podAdmin);

        vm.expectRevert(bytes("UNAUTHORIZED"));
        address fraud = address(0x10);
        vm.prank(fraud);
        factory.createChildOptimisticPod(podConfig, minDelay);
    }

    /// @notice Validate that a transferred feiDAOTimelock can create a pod
    function testGovernorCanCreatePod() public {
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        factory.createChildOptimisticPod(podConfig, minDelay);
    }

    function testGetNextPodId() public {
        uint256 nextPodId = factory.getNextPodId();
        assertGt(nextPodId, 10);
    }

    function testUpdatePodAdmin() public {
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, ) = factory.createChildOptimisticPod(
            podConfig,
            minDelay
        );

        address newAdmin = address(0x10);
        vm.prank(podAdmin);
        IControllerV1(podController).updatePodAdmin(podId, newAdmin);
        assertEq(IControllerV1(podController).podAdmin(podId), newAdmin);
        assertEq(factory.getPodAdmin(podId), newAdmin);
    }

    function testUpdatePodController() public {
        address newController = address(0x10);

        vm.prank(feiDAOTimelock);
        factory.updatePodController(newController);

        address updatedContoller = address(factory.podController());
        assertEq(updatedContoller, newController);
    }

    function testGnosisGetters() public {
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock) = factory.createChildOptimisticPod(
            podConfig,
            minDelay
        );

        uint256 numMembers = factory.getNumMembers(podId);
        assertEq(numMembers, podConfig.members.length);

        uint256 storedThreshold = factory.getPodThreshold(podId);
        assertEq(storedThreshold, podConfig.threshold);

        address[] memory storedMembers = factory.getPodMembers(podId);
        assertEq(storedMembers[0], podConfig.members[0]);
        assertEq(storedMembers[1], podConfig.members[1]);
        assertEq(storedMembers[2], podConfig.members[2]);

        uint256 latestPodId = factory.latestPodId();
        assertEq(latestPodId, podId);
    }

    /// @notice Creates a child pod with an optimistic timelock attached
    function testDeployOptimisticGovernancePod() public {
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock) = factory.createChildOptimisticPod(
            podConfig,
            minDelay
        );
        require(timelock != address(0));

        address safeAddress = factory.getPodSafe(podId);
        ITimelock timelockContract = ITimelock(timelock);

        // Gnosis safe should be the proposer
        bool hasProposerRole = timelockContract.hasRole(
            PROPOSER_ROLE,
            safeAddress
        );
        assertTrue(hasProposerRole);

        bool safeAddressIsExecutor = timelockContract.hasRole(
            EXECUTOR_ROLE,
            safeAddress
        );
        assertTrue(safeAddressIsExecutor);

        bool publicPodExecutorIsExecutor = timelockContract.hasRole(
            EXECUTOR_ROLE,
            address(podExecutor)
        );
        assertTrue(publicPodExecutorIsExecutor);
    }

    /// @notice Validate that the podId to timelock mapping is correct
    function testTimelockStorageOnDeploy() public {
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock) = factory.createChildOptimisticPod(
            podConfig,
            minDelay
        );

        assertEq(timelock, factory.getPodTimelock(podId));
        assertEq(podId, factory.getPodId(timelock));
    }

    /// @notice Validate that multiple pods can be deployed with the correct admin set
    function testDeployMultiplePods() public {
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(podAdmin);
        podConfig.label = bytes32("A");

        vm.prank(feiDAOTimelock);
        (uint256 podAId, ) = factory.createChildOptimisticPod(
            podConfig,
            minDelay
        );

        address podAAdmin = IControllerV1(podController).podAdmin(podAId);
        assertEq(podAAdmin, podAdmin);

        podConfig.label = bytes32("B");
        vm.prank(feiDAOTimelock);
        (uint256 podBId, ) = factory.createChildOptimisticPod(
            podConfig,
            minDelay
        );

        assertEq(podBId, podAId + 1);
        address podBAdmin = IControllerV1(podController).podAdmin(podBId);
        assertEq(podBAdmin, podAdmin);
    }
}
