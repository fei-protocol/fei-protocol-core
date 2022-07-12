// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";
import {IGnosisSafe} from "../../../pods/interfaces/IGnosisSafe.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {PodExecutor} from "../../../pods/PodExecutor.sol";
import {IPodFactory} from "../../../pods/interfaces/IPodFactory.sol";
import {Core} from "../../../core/Core.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {PodAdminGateway} from "../../../pods/PodAdminGateway.sol";

import {DSTest} from "../../utils/DSTest.sol";
import {mintOrcaTokens, getPodParamsWithTimelock, getCouncilPodParams, getPodParamsWithNoTimelock} from "../fixtures/Orca.sol";
import {DummyStorage} from "../../utils/Fixtures.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

/// @notice Validate PodFactory functionality, such as creating pods
contract PodFactoryIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    PodExecutor podExecutor;
    address private podAdmin;

    address core = MainnetAddresses.CORE;
    address memberToken = MainnetAddresses.MEMBER_TOKEN;
    address podController = MainnetAddresses.ORCA_POD_CONTROLLER_V1_2;
    address feiDAOTimelock = MainnetAddresses.FEI_DAO_TIMELOCK;

    function setUp() public {
        // 0. Deploy pod executor
        podExecutor = new PodExecutor(core);

        // 1. Deploy pod factory
        factory = new PodFactory(core, memberToken, podController, address(podExecutor));

        // 2. Deploy pod admin gateway
        PodAdminGateway podAdminGateway = new PodAdminGateway(core, memberToken, address(factory));
        podAdmin = address(podAdminGateway);

        mintOrcaTokens(address(factory), 2, vm);

        // Grant factory the PodAdmin role, to by default disable pod membership transfers
        vm.startPrank(feiDAOTimelock);
        Core(core).createRole(TribeRoles.POD_ADMIN, TribeRoles.GOVERNOR);
        Core(core).grantRole(TribeRoles.POD_ADMIN, address(factory));
        vm.stopPrank();
    }

    /// @notice Validate initial factory state
    function testInitialState() public {
        assertEq(factory.getNumberOfPods(), 0);
        assertEq(address(factory.podExecutor()), address(podExecutor));
        assertEq(address(factory.getMemberToken()), memberToken);
        assertEq(factory.MIN_TIMELOCK_DELAY(), 1 days);
        assertEq(address(factory.defaultPodController()), podController);

        address[] memory podSafeAddresses = factory.getPodSafeAddresses();
        assertEq(podSafeAddresses.length, 0);

        // Validate has PodAdmin role
        bool hasPodAdminRole = Core(core).hasRole(TribeRoles.POD_ADMIN, address(factory));
        assertTrue(hasPodAdminRole);

        uint256 nextPodId = factory.getNextPodId();
        assertGt(nextPodId, 0);
    }

    function testDeployGenesisPod() public {
        IPodFactory.PodConfig memory councilConfig = getCouncilPodParams(podAdmin);
        (
            uint256 councilPodId, /*address councilTimelock*/
            ,
            address councilSafe
        ) = factory.deployCouncilPod(councilConfig);

        uint256 numMembers = factory.getNumMembers(councilPodId);
        assertEq(numMembers, councilConfig.members.length);

        uint256 storedThreshold = factory.getPodThreshold(councilPodId);
        assertEq(storedThreshold, councilConfig.threshold);

        address[] memory storedMembers = factory.getPodMembers(councilPodId);
        assertEq(storedMembers[0], councilConfig.members[0]);
        assertEq(storedMembers[1], councilConfig.members[1]);
        assertEq(storedMembers[2], councilConfig.members[2]);

        assertEq(factory.getNumberOfPods(), 1);
        address[] memory podSafeAddresses = factory.getPodSafeAddresses();
        assertEq(podSafeAddresses.length, 1);
        assertEq(podSafeAddresses[0], councilSafe);

        assertEq(address(factory.getPodController(councilPodId)), podController);
    }

    function testCanOnlyDeployGenesisOnce() public {
        IPodFactory.PodConfig memory councilConfig = getCouncilPodParams(podAdmin);
        factory.deployCouncilPod(councilConfig);

        IPodFactory.PodConfig memory config = getPodParamsWithTimelock(podAdmin);
        vm.expectRevert(bytes("Genesis pod already deployed"));
        factory.deployCouncilPod(config);
    }

    /// @notice Validate that a non-authorised address fails to create a pod
    function testOnlyAuthedUsersCanCreatePod() public {
        IPodFactory.PodConfig memory councilConfig = getCouncilPodParams(podAdmin);

        vm.expectRevert(bytes("UNAUTHORIZED"));
        address fraud = address(0x10);
        vm.prank(fraud);
        factory.createOptimisticPod(councilConfig);
    }

    /// @notice Validate that a GOVERNOR role can create a pod
    function testGovernorCanCreatePod() public {
        IPodFactory.PodConfig memory councilConfig = getCouncilPodParams(podAdmin);

        vm.prank(feiDAOTimelock);
        factory.createOptimisticPod(councilConfig);
    }

    /// @notice Validate that the PodDeployerRole is able to deploy pods
    function testPodAdminCanDeploy() public {
        address dummyTribalCouncil = address(0x1);

        // Create ROLE_ADMIN, POD_ADMIN role and grant ROLE_ADMIN to a dummyTribalCouncil address
        vm.startPrank(feiDAOTimelock);
        Core(core).createRole(TribeRoles.ROLE_ADMIN, TribeRoles.GOVERNOR);
        Core(core).createRole(TribeRoles.POD_ADMIN, TribeRoles.ROLE_ADMIN);
        Core(core).grantRole(TribeRoles.ROLE_ADMIN, dummyTribalCouncil);
        vm.stopPrank();

        // Grant POD_ADMIN to a dummy address
        address dummyPodAdmin = address(0x2);
        vm.prank(dummyTribalCouncil);
        Core(core).grantRole(TribeRoles.POD_ADMIN, dummyPodAdmin);

        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(podAdmin);
        vm.prank(dummyPodAdmin);
        factory.createOptimisticPod(podConfig);
    }

    function testUpdatePodAdmin() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, , ) = factory.createOptimisticPod(podConfig);

        address newAdmin = address(0x10);
        vm.prank(podAdmin);
        ControllerV1(podController).updatePodAdmin(podId, newAdmin);
        assertEq(ControllerV1(podController).podAdmin(podId), newAdmin);
        assertEq(factory.getPodAdmin(podId), newAdmin);
    }

    function testPodDeployment() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock, address safe) = factory.createOptimisticPod(podConfig);

        ///// Validate Safe component of the Pod
        address safeAddress = factory.getPodSafe(podId);
        assertEq(safe, safeAddress);

        uint256 numMembers = factory.getNumMembers(podId);
        assertEq(numMembers, podConfig.members.length);

        uint256 storedThreshold = factory.getPodThreshold(podId);
        assertEq(storedThreshold, podConfig.threshold);

        address[] memory storedMembers = factory.getPodMembers(podId);
        assertEq(storedMembers[0], podConfig.members[0]);
        assertEq(storedMembers[1], podConfig.members[1]);
        assertEq(storedMembers[2], podConfig.members[2]);

        assertEq(factory.getNumberOfPods(), 1);
        address[] memory podSafeAddresses = factory.getPodSafeAddresses();
        assertEq(podSafeAddresses.length, 1);
        assertEq(podSafeAddresses[0], safe);

        ///// Validate timelock component of pod
        assertEq(timelock, factory.getPodTimelock(podId));
        TimelockController timelockContract = TimelockController(payable(timelock));

        // Gnosis safe should be: PROPOSER, EXECUTOR, CANCELLOR
        assertTrue(timelockContract.hasRole(timelockContract.PROPOSER_ROLE(), safe));
        assertTrue(timelockContract.hasRole(timelockContract.EXECUTOR_ROLE(), safe));
        assertTrue(timelockContract.hasRole(timelockContract.CANCELLER_ROLE(), safe));

        // PodExecutor should be: EXECUTOR
        assertTrue(timelockContract.hasRole(timelockContract.EXECUTOR_ROLE(), address(podExecutor)));

        // PodAdmin should be: CANCELLOR
        assertTrue(timelockContract.hasRole(timelockContract.CANCELLER_ROLE(), podAdmin));

        // Min delay of timelock
        assertEq(timelockContract.getMinDelay(), podConfig.minDelay);

        // Validate factory does not have TIMELOCK_ADMIN_ROLE
        assertFalse(timelockContract.hasRole(timelockContract.TIMELOCK_ADMIN_ROLE(), address(factory)));

        //// Validate that membership transfers are disabled
        bool membershipLocked = factory.getIsMembershipTransferLocked(podId);
        assertEq(membershipLocked, true);
    }

    /// @notice Validate that a pod can not be created with an insufficent min delay on timelock
    function testCanNotDeployPodWithInsufficientTimelock() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(podAdmin);

        uint256 insufficientDelay = factory.MIN_TIMELOCK_DELAY() - 1;
        podConfig.minDelay = insufficientDelay;

        vm.prank(feiDAOTimelock);
        vm.expectRevert(bytes("Min delay too small"));
        factory.createOptimisticPod(podConfig);
    }

    /// @notice Validate can create a pod without a timelock
    function testCanDeployPodWithNoTimelock() public {
        IPodFactory.PodConfig memory podConfigNoTimelock = getPodParamsWithNoTimelock(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock, address safe) = factory.createOptimisticPod(podConfigNoTimelock);

        assertEq(timelock, address(0));
        assertEq(timelock, factory.getPodTimelock(podId));
        assertEq(safe, factory.getPodSafe(podId));

        // Pod without a timelock will report podId of 0
        assertEq(0, factory.getPodId(timelock));
    }

    /// @notice Validate that the podId to timelock mapping is correct
    function testTimelockStorageOnDeploy() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(podAdmin);

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock, address safe) = factory.createOptimisticPod(podConfig);

        assertEq(timelock, factory.getPodTimelock(podId));
        assertEq(safe, factory.getPodSafe(podId));
        assertEq(podId, factory.getPodId(timelock));
    }

    /// @notice Validate that multiple pods can be deployed with the correct admin set
    function testDeployMultiplePods() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(podAdmin);

        podConfig.label = bytes32("A");

        vm.prank(feiDAOTimelock);
        (uint256 podAId, , address podASafeAddress) = factory.createOptimisticPod(podConfig);
        assertEq(factory.getNumberOfPods(), 1);
        address[] memory firstPodAddresses = factory.getPodSafeAddresses();
        assertEq(firstPodAddresses[0], podASafeAddress);

        address podAAdmin = ControllerV1(podController).podAdmin(podAId);
        assertEq(podAAdmin, podAdmin);

        podConfig.label = bytes32("B");
        vm.prank(feiDAOTimelock);
        (uint256 podBId, , address podBSafeAddress) = factory.createOptimisticPod(podConfig);
        assertEq(factory.getNumberOfPods(), 2);

        address[] memory secondPodAddresses = factory.getPodSafeAddresses();

        assertEq(secondPodAddresses[0], podASafeAddress);
        assertEq(secondPodAddresses[1], podBSafeAddress);

        assertEq(podBId, podAId + 1);
        address podBAdmin = ControllerV1(podController).podAdmin(podBId);
        assertEq(podBAdmin, podAdmin);
    }

    /// @notice Validate that the default pod controller can be updated
    function testUpdateDefaultPodController() public {
        address newDefaultPodController = address(0x123);
        vm.prank(feiDAOTimelock);
        factory.updateDefaultPodController(newDefaultPodController);
        assertEq(address(factory.defaultPodController()), newDefaultPodController);
    }

    /// @notice Validate that a pod controller can be updated and that will be reflected
    ///         on the pod factory
    function testPodControllerUpdate() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock(podAdmin);

        // Set default to old version, to create pod with old controller
        vm.prank(feiDAOTimelock);
        factory.updateDefaultPodController(MainnetAddresses.ORCA_POD_CONTROLLER_V1);
        assertEq(address(factory.defaultPodController()), MainnetAddresses.ORCA_POD_CONTROLLER_V1);

        vm.prank(feiDAOTimelock);
        (
            uint256 podId, /*address timelock*/
            ,
            address safe
        ) = factory.deployCouncilPod(podConfig);

        // 1. Get pod controller
        address defaultPodController = address(factory.defaultPodController());
        address initialPodController = address(factory.getPodController(podId));
        assertEq(defaultPodController, initialPodController);

        // 2. Pod migrates it's own pod controller to another minor version
        vm.prank(safe);
        ControllerV1(initialPodController).migratePodController(
            podId,
            MainnetAddresses.ORCA_POD_CONTROLLER_V1_2,
            MainnetAddresses.ORCA_POD_CONTROLLER_V1_2
        );

        // 3. Verify pod's controller was updated on the memberToken and factory
        address newPodControllerOnFactory = address(factory.getPodController(podId));
        address expectedNewPodController = MemberToken(memberToken).memberController(podId);

        assertEq(expectedNewPodController, newPodControllerOnFactory);
        assertEq(newPodControllerOnFactory, MainnetAddresses.ORCA_POD_CONTROLLER_V1_2);
    }
}
