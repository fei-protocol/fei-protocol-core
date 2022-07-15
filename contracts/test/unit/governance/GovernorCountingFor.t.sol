// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {getDAOMembers, createDummyEthProposal} from "../../utils/GovFixtures.sol";
import {NopeDAO} from "../../../dao/nopeDAO/NopeDAO.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {Tribe} from "../../../tribe/Tribe.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";

/// @dev Validates vote counting functionality of the GovernorCountingFor module. Module is abstract
///      so instantiated as a NopeDAO
contract GovernorCountingForTest is DSTest {
    address userWithQuorumTribe;
    address userWith5MTribe;
    address userWith2MTribe;
    address userWithZeroTribe;
    ERC20VotesComp tribe;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    NopeDAO private nopeDAO;

    FeiTestAddresses public addresses = getAddresses();
    uint256 proposalId;

    function setUp() public {
        // 1. Setup Core and TRIBE
        Core core = getCore();
        tribe = ERC20VotesComp(address(core.tribe()));

        // 2. Get various users with delegated TRIBE
        (userWithQuorumTribe, userWith5MTribe, userWith2MTribe, userWithZeroTribe) = getDAOMembers(
            core,
            tribe,
            addresses.governorAddress,
            vm
        );

        // 3. Deploy NopeDAO
        nopeDAO = new NopeDAO(tribe, address(core));

        // 4. Seed NopeDAO with ETH so in theory could execute the proposal
        vm.deal(address(nopeDAO), 10 ether);

        // 5. Random address creates the nopeDAO proposal
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,

        ) = createDummyEthProposal(address(this), 1 ether);

        proposalId = nopeDAO.propose(targets, values, calldatas, description);
        vm.roll(block.number + 1); // Make block number non-zero, for getVotes accounting
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
        assertEq(uint8(nopeDAO.state(proposalId)), 1);
        assertEq(nopeDAO.proposalThreshold(), 0);

        // Verify voter allocated expected votes
        assertEq(nopeDAO.getVotes(userWith5MTribe, block.number - 1), 5e6 * (10**18));
        assertEq(nopeDAO.getVotes(userWith2MTribe, block.number - 1), 2e6 * (10**18));
    }

    /// @notice Validate that a FOR vote is counted
    function testCountForVote() public {
        vm.prank(userWith5MTribe);
        nopeDAO.castVote(proposalId, 1);

        // Verify proposal state
        assertEq(uint8(nopeDAO.state(proposalId)), 1);

        // Verify voting accounting
        assertTrue(nopeDAO.hasVoted(proposalId, userWith5MTribe));
        assertEq(nopeDAO.proposalVotes(proposalId), 5e6 * (10**18));
    }

    /// @notice Validate arithmetic of counting multiple FOR votes
    function testCountMultipleForVotes() public {
        vm.prank(userWith5MTribe);
        nopeDAO.castVote(proposalId, 1);

        vm.prank(userWith2MTribe);
        nopeDAO.castVote(proposalId, 1);

        // Verify proposal state
        assertEq(uint8(nopeDAO.state(proposalId)), 1);

        // Verify voting accounting
        assertTrue(nopeDAO.hasVoted(proposalId, userWith5MTribe));
        assertTrue(nopeDAO.hasVoted(proposalId, userWith2MTribe));
        assertEq(nopeDAO.proposalVotes(proposalId), (5e6 + 2e6) * (10**18));
    }

    /// @notice Validate that a non-FOR vote is rejected
    function testRejectsNonForVote() public {
        vm.prank(userWith5MTribe);
        vm.expectRevert(bytes("GovernorCountingFor: only FOR votes supported"));
        nopeDAO.castVote(proposalId, 0);
    }

    /// @notice Validate that quorum can be reached with sufficient FOR votes
    function testQuorumCanBeReached() public {
        vm.prank(userWithQuorumTribe);
        nopeDAO.castVote(proposalId, 1);
        assertEq(uint8(nopeDAO.state(proposalId)), 4);
    }
}
