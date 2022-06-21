// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {IPodFactory} from "../../../pods/interfaces/IPodFactory.sol";
import {Vm} from "../../utils/Vm.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {NopeDAO} from "../../../dao/nopeDAO/NopeDAO.sol";
import {Core} from "../../../core/Core.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {deployPodWithSystem} from "../fixtures/Orca.sol";
import {PodAdminGateway} from "../../../pods/PodAdminGateway.sol";
import {DummyStorage} from "../../utils/Fixtures.sol";
import {IPodFactory} from "../../../pods/interfaces/IPodFactory.sol";

contract NopeDAOIntegrationTest is DSTest {
    uint256 excessQuorumTribe = (11e6) * (10**18);

    uint256 podId;
    address podTimelock;
    address safe;

    address private user = address(0x1);
    address private podExecutor = address(0x2);
    address private podAdmin;
    address private factory;
    IPodFactory.PodConfig podConfig;

    NopeDAO nopeDAO;
    Core core = Core(MainnetAddresses.CORE);
    ERC20VotesComp tribe = ERC20VotesComp(MainnetAddresses.TRIBE);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        nopeDAO = new NopeDAO(tribe, MainnetAddresses.CORE);

        // Transfer Tribe from treasury to a user
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        core.allocateTribe(user, excessQuorumTribe);

        // Self-delegate that Tribe
        vm.prank(user);
        tribe.delegate(user);

        // Create POD_VETO_ADMIN role and grant to NopeDAO
        vm.startPrank(MainnetAddresses.FEI_DAO_TIMELOCK);
        core.createRole(TribeRoles.POD_VETO_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.POD_VETO_ADMIN, address(nopeDAO));
        vm.stopPrank();

        // Create pod, using a podFactory
        (podId, podTimelock, safe, factory, podAdmin, podConfig) = deployPodWithSystem(
            MainnetAddresses.CORE,
            MainnetAddresses.ORCA_POD_CONTROLLER_V1_2,
            MainnetAddresses.MEMBER_TOKEN,
            podExecutor,
            MainnetAddresses.FEI_DAO_TIMELOCK,
            vm
        );
    }

    /// @notice Validate that inital setup worked
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.POD_VETO_ADMIN, address(nopeDAO)));
    }

    /// @notice Validate that the GOVERNOR can update the NopeDAO settings
    function testGovernorCanUpdateQuroum() public {
        uint256 newQuorum = 15_000_000e18;
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        nopeDAO.setQuorum(newQuorum);

        uint256 updatedQuorum = nopeDAO.quorum(0);
        assertEq(updatedQuorum, newQuorum);
    }

    function testGovernorCanUpdateVotingDelay() public {
        uint256 newVotingDelay = 10;
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        nopeDAO.setVotingDelay(newVotingDelay);

        uint256 updatedVotingDelay = nopeDAO.votingDelay();
        assertEq(updatedVotingDelay, newVotingDelay);
    }

    function testGovernorCanUpdateVotingPeriod() public {
        uint256 newVotingPeriod = 86_400;
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        nopeDAO.setVotingPeriod(newVotingPeriod);

        uint256 updatedVotingPeriod = nopeDAO.votingPeriod();
        assertEq(updatedVotingPeriod, newVotingPeriod);
    }

    function testGovernorCanUpdateProposalThreshold() public {
        uint256 newProposalThreshold = 100;
        vm.prank(MainnetAddresses.FEI_DAO_TIMELOCK);
        nopeDAO.setProposalThreshold(newProposalThreshold);

        uint256 updatedProposalThreshold = nopeDAO.proposalThreshold();
        assertEq(updatedProposalThreshold, newProposalThreshold);
    }

    /// @notice Validate that NopeDAO can not update it's own governor settings
    function testCanNotUpdateOwnGovernorSettings() public {
        vm.roll(block.number + 1);

        address[] memory targets = new address[](1);
        targets[0] = address(nopeDAO);

        uint256[] memory values = new uint256[](1);
        values[0] = uint256(0);

        uint256 newVotingDelay = 10;
        bytes[] memory calldatas = new bytes[](1);
        bytes memory data = abi.encodePacked(bytes4(keccak256(bytes("setVotingDelay(uint256)"))), newVotingDelay);
        calldatas[0] = data;

        string memory description = "Dummy proposal";
        bytes32 descriptionHash = keccak256(bytes(description));

        vm.prank(user);
        uint256 proposalId = nopeDAO.propose(targets, values, calldatas, description);
        vm.roll(block.number + 1);

        // Cast a vote for the proposal, in excess of quorum
        vm.prank(user);
        nopeDAO.castVote(proposalId, 1);

        // No need to skip to end of voting, can execute immediately

        // Validate proposal is now successful
        uint8 state = uint8(nopeDAO.state(proposalId));
        assertEq(state, uint8(4));

        // Execute and validate nopeDAO can not update it's own governor settings
        vm.expectRevert(bytes("UNAUTHORIZED"));
        nopeDAO.execute(targets, values, calldatas, descriptionHash);
    }

    /// @notice Validate that the NopeDAO can veto a proposal in a pod timelock
    function testNope() public {
        vm.roll(block.number + 1);

        // 1. Deploy Dummy contract to perform a transaction on
        DummyStorage dummyContract = new DummyStorage();
        assertEq(dummyContract.getVariable(), 5);

        TimelockController timelockContract = TimelockController(payable(podTimelock));

        // 2. Schedle a transaction from the Pod's safe address to timelock. Transaction sets a variable on a dummy contract
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

        // 3. Validate that transaction is in timelock
        bytes32 timelockProposalId = timelockContract.hashOperation(
            address(dummyContract),
            0,
            timelockExecutionTxData,
            bytes32(0),
            bytes32("1")
        );
        assertTrue(timelockContract.isOperationPending(timelockProposalId));

        // 4. Prepare NopeDAO transaction to veto the Safe proposal
        // Need veto to come from nopeDAO to the podAdminGateway
        address[] memory targets = new address[](1);
        targets[0] = podAdmin;

        uint256[] memory values = new uint256[](1);
        values[0] = uint256(0);

        bytes[] memory calldatas = new bytes[](1);
        bytes memory data = abi.encodeWithSignature("veto(uint256,bytes32)", podId, timelockProposalId);
        calldatas[0] = data;

        string memory description = "Veto proposal";
        bytes32 descriptionHash = keccak256(bytes(description));

        uint256 nopeDAOProposalId = nopeDAO.propose(targets, values, calldatas, description);

        // 5. Have user with >quorum delegated TRIBE veto
        vm.roll(block.number + 1);
        // Cast a vote for the proposal, in excess of quorum
        vm.prank(user);
        nopeDAO.castVote(nopeDAOProposalId, 1);

        uint8 state = uint8(nopeDAO.state(nopeDAOProposalId));
        assertEq(state, uint8(4));

        // Will send cancel transaction to podAdminGateway
        nopeDAO.execute(targets, values, calldatas, descriptionHash);

        // 6. Verify that timelocked transaction was vetoed
        uint256 proposalTimestampReady = timelockContract.getTimestamp(timelockProposalId);
        assertEq(proposalTimestampReady, 0);
    }
}
