// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {PodFactory} from "../../../pods/PodFactory.sol";
import {PodExecutor} from "../../../pods/PodExecutor.sol";
import {ITimelock} from "../../../dao/timelock/ITimelock.sol";
import {IControllerV1} from "../../../pods/orcaInterfaces/IControllerV1.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";
import {Core} from "../../../core/Core.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";

import {DSTest} from "../../utils/DSTest.sol";
import {mintOrcaTokens, getPodParams} from "../fixtures/Orca.sol";
import {Vm} from "../../utils/Vm.sol";
import {getMainnetAddresses, MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

/// @notice Validate PodFactory critical functionality such as creating pods
///  @dev PodAdmin can not also be a pod member
contract PodFactoryIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    PodExecutor podExecutor;
    address private podAdmin = address(0x3);

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    MainnetAddresses mainnetAddresses = getMainnetAddresses();
    address core = mainnetAddresses.core;
    address memberToken = mainnetAddresses.memberToken;
    address podController = mainnetAddresses.podController;
    address feiDAOTimelock = mainnetAddresses.feiDAOTimelock;

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

    /// @notice Validate that a non-authorised address fails to create a pod
    function testOnlyAuthedUsersCanCreatePod() public {
        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);

        vm.expectRevert(bytes("UNAUTHORIZED"));
        address fraud = address(0x10);
        vm.prank(fraud);
        factory.createChildOptimisticPod(podConfig);
    }

    /// @notice Validate that a GOVERNOR role can create a pod
    function testGovernorCanCreatePod() public {
        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        factory.createChildOptimisticPod(podConfig);
    }

    /// @notice Validate that the PodDeployerRole is able to deploy pods
    function testPodDeployerRoleCanDeploy() public {
        address dummyTribalCouncil = address(0x1);

        // Create ROLE_ADMIN, POD_DEPLOYER role and grant ROLE_ADMIN to a dummyTribalCouncil address
        vm.startPrank(feiDAOTimelock);
        Core(core).createRole(TribeRoles.ROLE_ADMIN, TribeRoles.GOVERNOR);
        Core(core).createRole(
            TribeRoles.POD_DEPLOYER_ROLE,
            TribeRoles.ROLE_ADMIN
        );
        Core(core).grantRole(TribeRoles.ROLE_ADMIN, dummyTribalCouncil);
        vm.stopPrank();

        // Grant POD_DEPLOYER_ROLE to a dummyPodDeployer
        address dummyPodDeployer = address(0x2);
        vm.prank(dummyTribalCouncil);
        Core(core).grantRole(TribeRoles.POD_DEPLOYER_ROLE, dummyPodDeployer);

        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);
        vm.prank(dummyPodDeployer);
        factory.createChildOptimisticPod(podConfig);
    }

    function testGetNextPodId() public {
        uint256 nextPodId = factory.getNextPodId();
        assertGt(nextPodId, 10);
    }

    function testGnosisGetters() public {
        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock) = factory.createChildOptimisticPod(
            podConfig
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

    function testUpdatePodAdmin() public {
        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, ) = factory.createChildOptimisticPod(podConfig);

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

    /// @notice Creates a child pod with an optimistic timelock attached
    function testDeployOptimisticGovernancePod() public {
        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock) = factory.createChildOptimisticPod(
            podConfig
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
        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock) = factory.createChildOptimisticPod(
            podConfig
        );

        assertEq(timelock, factory.getPodTimelock(podId));
        assertEq(podId, factory.getPodId(timelock));
    }

    /// @notice Validate that multiple pods can be deployed with the correct admin set
    function testDeployMultiplePods() public {
        IPodFactory.PodConfig memory podConfig = getPodParams(podAdmin);

        podConfig.label = bytes32("A");

        vm.prank(feiDAOTimelock);
        (uint256 podAId, ) = factory.createChildOptimisticPod(podConfig);

        address podAAdmin = IControllerV1(podController).podAdmin(podAId);
        assertEq(podAAdmin, podAdmin);

        podConfig.label = bytes32("B");
        vm.prank(feiDAOTimelock);
        (uint256 podBId, ) = factory.createChildOptimisticPod(podConfig);

        assertEq(podBId, podAId + 1);
        address podBAdmin = IControllerV1(podController).podAdmin(podBId);
        assertEq(podBAdmin, podAdmin);
    }

    function testBurnerPodDeploy() public {
        IPodFactory.PodConfig memory podConfigA = getPodParams(podAdmin);
        podConfigA.label = bytes32("A");

        IPodFactory.PodConfig memory podConfigB = getPodParams(podAdmin);
        podConfigB.label = bytes32("B");

        IPodFactory.PodConfig[] memory configs = new IPodFactory.PodConfig[](2);
        configs[0] = podConfigA;
        configs[1] = podConfigB;

        vm.prank(feiDAOTimelock);
        (uint256[] memory podIds, ) = factory.burnerCreateChildOptimisticPods(
            configs
        );
        assertTrue(factory.burnerDeploymentUsed());

        vm.expectRevert(bytes("Burner deployment already used"));
        factory.burnerCreateChildOptimisticPods(configs);

        // Check pod admin
        address setPodAdminA = IControllerV1(podController).podAdmin(podIds[0]);
        assertEq(setPodAdminA, podAdmin);

        address setPodAdminB = IControllerV1(podController).podAdmin(podIds[0]);
        assertEq(setPodAdminB, podAdmin);
    }
}
