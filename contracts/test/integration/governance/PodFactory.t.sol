// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {IGnosisSafe} from "../../../pods/interfaces/IGnosisSafe.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {PodExecutor} from "../../../pods/PodExecutor.sol";
import {IPodFactory} from "../../../pods/interfaces/IPodFactory.sol";
import {Core} from "../../../core/Core.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {PodAdminGateway} from "../../../pods/PodAdminGateway.sol";

import {DSTest} from "../../utils/DSTest.sol";
import {mintOrcaTokens, getPodParamsWithTimelock, getGenesisPodParams, getPodParamsWithNoTimelock} from "../fixtures/Orca.sol";
import {DummyStorage} from "../../utils/Fixtures.sol";
import {Vm} from "../../utils/Vm.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

/// @notice Validate PodFactory critical functionality such as creating pods
///  @dev PodAdmin can not also be a pod member
contract PodFactoryIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    PodExecutor podExecutor;
    address private podAdmin;

    bytes32 public constant PROPOSER_ROLE = keccak256("PROPOSER_ROLE");
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    address core = MainnetAddresses.CORE;
    address memberToken = MainnetAddresses.MEMBER_TOKEN;
    address podController = MainnetAddresses.POD_CONTROLLER;
    address feiDAOTimelock = MainnetAddresses.FEI_DAO_TIMELOCK;

    function setUp() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        PodAdminGateway podAdminGateway = new PodAdminGateway(
            core,
            memberToken,
            podController
        );

        podExecutor = new PodExecutor();
        factory = new PodFactory(
            core,
            podController,
            memberToken,
            address(podExecutor),
            address(podAdminGateway)
        );
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
        assertEq(address(factory.podController()), podController);
        assertEq(factory.latestPodId(), 0);
        assertEq(address(factory.podExecutor()), address(podExecutor));
        assertEq(address(factory.getMemberToken()), memberToken);
        assertEq(factory.MIN_TIMELOCK_DELAY(), 1 days);

        // Validate has PodAdmin role
        bool hasPodAdminRole = Core(core).hasRole(
            TribeRoles.POD_ADMIN,
            address(factory)
        );
        assertTrue(hasPodAdminRole);

        uint256 nextPodId = factory.getNextPodId();
        assertGt(nextPodId, 0);
    }

    function testDeployGenesisPod() public {
        IPodFactory.PodConfig memory genesisConfig = getGenesisPodParams();
        (
            uint256 genesisPodId,
            address genesisTimelock,
            address genesisSafe
        ) = factory.deployGenesisPod(genesisConfig);

        uint256 numMembers = factory.getNumMembers(genesisPodId);
        assertEq(numMembers, genesisConfig.members.length);

        uint256 storedThreshold = factory.getPodThreshold(genesisPodId);
        assertEq(storedThreshold, genesisConfig.threshold);

        address[] memory storedMembers = factory.getPodMembers(genesisPodId);
        assertEq(storedMembers[0], genesisConfig.members[0]);
        assertEq(storedMembers[1], genesisConfig.members[1]);
        assertEq(storedMembers[2], genesisConfig.members[2]);

        uint256 latestPodId = factory.latestPodId();
        assertEq(latestPodId, genesisPodId);
    }

    function testCanOnlyDeployGenesisOnce() public {
        IPodFactory.PodConfig memory genesisConfig = getGenesisPodParams();
        (
            uint256 genesisPodId,
            address genesisTimelock,
            address genesisSafe
        ) = factory.deployGenesisPod(genesisConfig);

        IPodFactory.PodConfig memory config = getPodParamsWithTimelock();
        vm.expectRevert(bytes("Genesis pod already deployed"));
        factory.deployGenesisPod(config);
    }

    /// @notice Validate that a non-authorised address fails to create a pod
    function testOnlyAuthedUsersCanCreatePod() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        vm.expectRevert(bytes("UNAUTHORIZED"));
        address fraud = address(0x10);
        vm.prank(fraud);
        factory.createOptimisticPod(podConfig);
    }

    /// @notice Validate that a GOVERNOR role can create a pod
    function testGovernorCanCreatePod() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        vm.prank(feiDAOTimelock);
        factory.createOptimisticPod(podConfig);
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

        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();
        vm.prank(dummyPodAdmin);
        factory.createOptimisticPod(podConfig);
    }

    function testUpdatePodAdmin() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        vm.prank(feiDAOTimelock);
        (uint256 podId, , ) = factory.createOptimisticPod(podConfig);

        address newAdmin = address(0x10);
        vm.prank(podAdmin);
        ControllerV1(podController).updatePodAdmin(podId, newAdmin);
        assertEq(ControllerV1(podController).podAdmin(podId), newAdmin);
        assertEq(factory.getPodAdmin(podId), newAdmin);
    }

    function testPodDeployment() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock, address safe) = factory
            .createOptimisticPod(podConfig);

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

        uint256 latestPodId = factory.latestPodId();
        assertEq(latestPodId, podId);

        ///// Validate timelock component of pod
        assertEq(timelock, factory.getPodTimelock(podId));
        TimelockController timelockContract = TimelockController(
            payable(timelock)
        );

        // Gnosis safe should be the proposer
        bool hasProposerRole = timelockContract.hasRole(PROPOSER_ROLE, safe);
        assertTrue(hasProposerRole);

        bool safeAddressIsExecutor = timelockContract.hasRole(
            EXECUTOR_ROLE,
            safe
        );
        assertTrue(safeAddressIsExecutor);

        bool publicPodExecutorIsExecutor = timelockContract.hasRole(
            EXECUTOR_ROLE,
            address(podExecutor)
        );
        assertTrue(publicPodExecutorIsExecutor);

        // Min delay of timelock
        assertEq(timelockContract.getMinDelay(), podConfig.minDelay);

        //// Validate that membership transfers are disabled
        bool membershipLocked = factory.getIsMembershipTransferLocked(podId);
        assertEq(membershipLocked, true);
    }

    /// @notice Validate that a pod can not be created with an insufficent min delay on timelock
    function testCanNotDeployPodWithInsufficientTimelock() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        uint256 insufficientDelay = factory.MIN_TIMELOCK_DELAY() - 1;
        podConfig.minDelay = insufficientDelay;

        vm.prank(feiDAOTimelock);
        vm.expectRevert(bytes("Min delay too small"));
        factory.createOptimisticPod(podConfig);
    }

    /// @notice Validate can create a pod without a timelock
    function testCanDeployPodWithNoTimelock() public {
        IPodFactory.PodConfig
            memory podConfigNoTimelock = getPodParamsWithNoTimelock();

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock, address safe) = factory
            .createOptimisticPod(podConfigNoTimelock);

        assertEq(timelock, address(0));
        assertEq(timelock, factory.getPodTimelock(podId));
        assertEq(safe, factory.getPodSafe(podId));
        assertEq(podId, factory.getPodId(timelock));
    }

    /// @notice Validate that the podId to timelock mapping is correct
    function testTimelockStorageOnDeploy() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock, address safe) = factory
            .createOptimisticPod(podConfig);

        assertEq(timelock, factory.getPodTimelock(podId));
        assertEq(safe, factory.getPodSafe(podId));
        assertEq(podId, factory.getPodId(timelock));
    }

    /// @notice Validate that multiple pods can be deployed with the correct admin set
    function testDeployMultiplePods() public {
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();

        podConfig.label = bytes32("A");

        vm.prank(feiDAOTimelock);
        (uint256 podAId, , ) = factory.createOptimisticPod(podConfig);

        address podAAdmin = ControllerV1(podController).podAdmin(podAId);
        assertEq(podAAdmin, podAdmin);

        podConfig.label = bytes32("B");
        vm.prank(feiDAOTimelock);
        (uint256 podBId, , ) = factory.createOptimisticPod(podConfig);

        assertEq(podBId, podAId + 1);
        address podBAdmin = ControllerV1(podController).podAdmin(podBId);
        assertEq(podBAdmin, podAdmin);
    }

    /// @notice Validate that can create a transaction in the pod and that it progresses to the timelock
    function testCreateTxInOptimisticPod() public {
        vm.warp(1);
        vm.roll(1);

        // 1. Deploy Dummy contract to perform a transaction on
        DummyStorage dummyContract = new DummyStorage();
        assertEq(dummyContract.getVariable(), 5);

        // 2. Deploy pod
        IPodFactory.PodConfig memory podConfig = getPodParamsWithTimelock();
        vm.prank(feiDAOTimelock);
        (, address podTimelock, address safe) = factory.createOptimisticPod(
            podConfig
        );

        TimelockController timelockContract = TimelockController(
            payable(podTimelock)
        );

        // 3. Schedle a transaction from the Pod's safe address to timelock. Transaction sets a variable on a dummy contract
        uint256 newDummyContractVar = 10;
        bytes memory timelockExecutionTxData = abi.encodePacked(
            bytes4(keccak256(bytes("setVariable(uint256)"))),
            newDummyContractVar
        );

        vm.prank(safe);
        timelockContract.schedule(
            address(dummyContract),
            0,
            timelockExecutionTxData,
            bytes32(0),
            bytes32("1"),
            podConfig.minDelay
        );

        // 4. Validate that transaction is in timelock
        bytes32 txHash = timelockContract.hashOperation(
            address(dummyContract),
            0,
            timelockExecutionTxData,
            bytes32(0),
            bytes32("1")
        );
        assertTrue(timelockContract.isOperationPending(txHash));

        // 5. Fast forward to execution time in timelock
        vm.warp(podConfig.minDelay + 10);
        vm.roll(podConfig.minDelay + 10);

        // 6. Execute transaction and validate state is updated
        podExecutor.execute(
            podTimelock,
            address(dummyContract),
            0,
            timelockExecutionTxData,
            bytes32(0),
            bytes32("1")
        );

        assertTrue(timelockContract.isOperationDone(txHash));
        assertEq(dummyContract.getVariable(), newDummyContractVar);
    }
}
