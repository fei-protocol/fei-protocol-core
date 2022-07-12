// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {NopeDAO} from "../../../dao/nopeDAO/NopeDAO.sol";
import {getCore, getAddresses, FeiTestAddresses, DummyStorage} from "../../utils/Fixtures.sol";
import {Tribe} from "../../../tribe/Tribe.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";

/// @notice Fixture to create a dummy proposal
function createDummyProposal(address dummyContract, uint256 newVariable)
    pure
    returns (
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        string memory,
        bytes32
    )
{
    address[] memory targets = new address[](1);
    targets[0] = dummyContract;

    uint256[] memory values = new uint256[](1);
    values[0] = uint256(0);

    bytes[] memory calldatas = new bytes[](1);
    bytes memory data = abi.encodePacked(bytes4(keccak256(bytes("setVariable(uint256)"))), newVariable);
    calldatas[0] = data;

    string memory description = "Dummy proposal";
    bytes32 descriptionHash = keccak256(bytes(description));
    return (targets, values, calldatas, description, descriptionHash);
}

contract NopeDAOTest is DSTest {
    address user = address(0x1);
    uint256 excessQuorumTribe = (11e6) * (10**18);
    address tribeAddress;
    ERC20VotesComp tribe;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    NopeDAO private nopeDAO;
    Core private core;

    FeiTestAddresses public addresses = getAddresses();

    function setUp() public {
        // 1. Setup core
        //    - this also deploys Fei and Tribe
        core = getCore();

        // 2. Setup Tribe and transfer some to a test address
        tribeAddress = address(core.tribe());

        vm.prank(addresses.governorAddress);
        core.allocateTribe(user, excessQuorumTribe);

        tribe = ERC20VotesComp(tribeAddress);

        vm.prank(user);
        tribe.delegate(user);

        // 3. Deploy NopeDAO
        nopeDAO = new NopeDAO(tribe, address(core));
    }

    /// @notice Validate initial state of the NopeDAO
    function testInitialState() public {
        uint256 quorum = nopeDAO.quorum(uint256(0));
        assertEq(quorum, 10_000_000e18);

        uint256 votingDelay = nopeDAO.votingDelay();
        assertEq(votingDelay, 0);

        uint256 votingPeriod = nopeDAO.votingPeriod();
        uint256 fourDays = 26585; // (86400 * 4) / 13
        assertEq(votingPeriod, fourDays);

        uint256 proposalThreshold = nopeDAO.proposalThreshold();
        assertEq(proposalThreshold, 0);

        address token = address(nopeDAO.token());
        assertEq(token, tribeAddress);

        uint256 userVoteWeight = tribe.getCurrentVotes(user);
        assertEq(userVoteWeight, excessQuorumTribe);
    }

    /// @notice Validate the quick reaction governor and that state is set to SUCCEEDED as soon as quorum is reached
    function testQuickReaction() public {
        vm.roll(1); // Make block number non-zero, for getVotes accounting

        DummyStorage dummyStorageContract = new DummyStorage();
        uint256 newVariable = 10;
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,

        ) = createDummyProposal(address(dummyStorageContract), newVariable);

        // Propose and validate state
        uint256 proposalId = nopeDAO.propose(targets, values, calldatas, description);

        // 1. Validate Pending
        uint8 statePending = uint8(nopeDAO.state(proposalId));
        assertEq(statePending, uint8(0)); // pending
        vm.roll(block.number + 1);

        // 2. Validate Active
        uint8 stateActive = uint8(nopeDAO.state(proposalId));
        assertEq(stateActive, uint8(1)); // active
        vm.roll(block.number + 1);

        // 3. Validate Succeeded, without a need for fast forwarding in time. Quorum reached when pass vote
        vm.prank(user);
        nopeDAO.castVote(proposalId, 1);
        uint8 stateSucceeded = uint8(nopeDAO.state(proposalId));
        assertEq(stateSucceeded, uint8(4)); // succeeded
    }

    /// @notice Validate that a DAO proposal can be executed.
    ///         Specifically, targets a dummy mock contract
    function testProposalExecutes() public {
        vm.roll(block.number + 1); // Make block number non-zero, for getVotes accounting
        DummyStorage dummyStorageContract = new DummyStorage();
        assertEq(dummyStorageContract.getVariable(), uint256(5));

        uint256 newVariable = 10;
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,
            bytes32 descriptionHash
        ) = createDummyProposal(address(dummyStorageContract), newVariable);

        vm.prank(user);
        uint256 proposalId = nopeDAO.propose(targets, values, calldatas, description);

        // Advance past the 1 voting block
        vm.roll(block.number + 1);

        // Cast a vote for the proposal, in excess of quorum
        vm.prank(user);
        nopeDAO.castVote(proposalId, 1);

        // Validate proposal is now successful
        uint8 state = uint8(nopeDAO.state(proposalId));
        assertEq(state, uint8(4));

        // Execute
        nopeDAO.execute(targets, values, calldatas, descriptionHash);

        // Validate that dummy test contract was interacted with as expected
        uint256 updatedVariable = dummyStorageContract.getVariable();
        assertEq(updatedVariable, newVariable);
    }
}
