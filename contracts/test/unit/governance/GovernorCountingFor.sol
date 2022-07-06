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
function createDummyProposal(address ethReceiver, uint256 ethAmount)
    returns (
        address[] memory,
        uint256[] memory,
        bytes[] memory,
        string memory,
        bytes32
    )
{
    address[] memory targets = new address[](1);
    targets[0] = ethReceiver;

    uint256[] memory values = new uint256[](1);
    values[0] = ethAmount;

    bytes[] memory calldatas = new bytes[](1);
    bytes memory data = abi.encodePacked(bytes4(keccak256(bytes("transfer(uint256)"))), ethAmount);
    calldatas[0] = data;

    string memory description = "Dummy proposal to send ETH";
    bytes32 descriptionHash = keccak256(bytes(description));
    return (targets, values, calldatas, description, descriptionHash);
}

/// @dev Validates vote counting functionality of the GovernorCountingFor module. Module is abstract
///      so instantiated as a NopeDAO
contract GovernorCountingFor is DSTest {
    address userWithQuorumTribe = address(0x1);
    address userWithInsufficientTribe = address(0x2);
    address userWithZeroTribe = address(0x3);

    uint256 excessQuorumTribe = (11e6) * (10**18);
    address tribeAddress;
    ERC20VotesComp tribe;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    NopeDAO private nopeDAO;
    Core private core;

    FeiTestAddresses public addresses = getAddresses();
    uint256 proposalId;

    function setUp() public {
        // 1. Setup core
        core = getCore();

        // 2. Setup Tribe and transfer some to a test address
        tribeAddress = address(core.tribe());

        vm.startPrank(addresses.governorAddress);
        core.allocateTribe(userWithQuorumTribe, excessQuorumTribe);
        core.allocateTribe(userWithInsufficientTribe, 5e6 * (10**18));
        vm.stopPrank();

        tribe = ERC20VotesComp(tribeAddress);

        vm.prank(userWithQuorumTribe);
        tribe.delegate(userWithQuorumTribe);

        // 3. Deploy NopeDAO
        nopeDAO = new NopeDAO(tribe, address(core));

        vm.roll(block.number + 1); // Make block number non-zero, for getVotes accounting

        // 4. Seed NopeDAO with ETH so in theory could execute the proposal
        vm.deal(address(nopeDAO), 10 ether);

        // 5. Random address creates the nopeDAO proposal
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,
            bytes32 descriptionHash
        ) = createDummyProposal(address(this), 1 ether);

        proposalId = nopeDAO.propose(targets, values, calldatas, description);
    }

    // enum ProposalState {
    //     Pending,
    //     Active,
    //     Canceled,
    //     Defeated,
    //     Succeeded,
    //     Queued,
    //     Expired,
    //     Executed
    // }

    /// @notice Validate initial state of the proposal and no votes
    function testInitialState() public {
        assertEq(nopeDAO.COUNTING_MODE(), "quorum=bravo");
        assertEq(nopeDAO.proposalVotes(proposalId), 0);
        assertEq(nopeDAO.hasVoted(proposalId, address(this)), false);
        assertEq(uint8(nopeDAO.state(proposalId)), 0);
    }

    /// @notice Validate that a FOR vote is counted
    function testCountForVote() public {
        vm.prank(userWithQuorumTribe);
        nopeDAO.castVote(proposalId, 1);

        // Verify proposal state and vote balance
        assertEq(uint8(nopeDAO.state(proposalId)), 0);

        assertEq(uint8(nopeDAO.state(proposalId)), 0);
    }

    /// @notice Validate that multiple FOR votes are counted
    function testCountMultipleForVotes() public {}

    /// @notice Validate that a non-FOR vote is rejected
    function testRejectsNonForVote() public {}

    /// @notice Validate that votes are always counted as having succeeded
    function testVoteSucceededAlwaysTrue() public {}

    /// @notice Validate that quorum can be reached with sufficient FOR votes
    function testQuorumCanBeReached() public {}
}
