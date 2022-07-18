// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {NopeDAO} from "../../../dao/nopeDAO/NopeDAO.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {DummyStorage, createDummyEthProposal, getDAOMembers} from "../../utils/GovFixtures.sol";
import {Tribe} from "../../../tribe/Tribe.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";

/// @dev Validates quick reaction governor module, used in the NopeDAO to veto a proposal
contract GovernorQuickReactionTest is DSTest {
    address userWithQuorumTribe;
    address userWith5MTribe;
    address userWith2MTribe;
    address userWithZeroTribe;
    ERC20VotesComp tribe;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    NopeDAO private nopeDAO;

    FeiTestAddresses public addresses = getAddresses();
    address ethReceiver = address(1);

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

        // 4. Seed NopeDAO with ETH so it can execute the proposal
        vm.deal(address(nopeDAO), 10 ether);
    }

    /// @notice Validate that a pending proposal can not be executed
    function testCanNotExecutePendingProposal() public {
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,
            bytes32 descriptionHash
        ) = createDummyEthProposal(ethReceiver, 1 ether);

        uint256 proposalId = nopeDAO.propose(targets, values, calldatas, description);
        assertEq(uint8(nopeDAO.state(proposalId)), 0);

        vm.expectRevert(bytes("Governor: proposal not successful"));
        nopeDAO.execute(targets, values, calldatas, descriptionHash);
    }

    /// @notice Validate that an active proposal with quorum not met, can not be executed
    function testCanNotExecuteActiveUnsuccessfulProposal() public {
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,
            bytes32 descriptionHash
        ) = createDummyEthProposal(ethReceiver, 1 ether);

        uint256 proposalId = nopeDAO.propose(targets, values, calldatas, description);
        vm.roll(block.number + 1); // Make vote active
        assertEq(uint8(nopeDAO.state(proposalId)), 1);

        vm.expectRevert(bytes("Governor: proposal not successful"));
        nopeDAO.execute(targets, values, calldatas, descriptionHash);
    }

    /// @notice Validate can quick reaction execute successful proposal
    function testQuickReactionProposal() public {
        uint256 ethTransferAmount = 1 ether;
        uint256 initialEthBalance = ethReceiver.balance;
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,
            bytes32 descriptionHash
        ) = createDummyEthProposal(ethReceiver, ethTransferAmount);

        uint256 proposalId = nopeDAO.propose(targets, values, calldatas, description);
        vm.roll(block.number + 1); // Make vote active

        vm.prank(userWithQuorumTribe);
        nopeDAO.castVote(proposalId, 1);

        // Validate succeeded
        assertEq(uint8(nopeDAO.state(proposalId)), 4);

        nopeDAO.execute(targets, values, calldatas, descriptionHash);

        // Verify this contract got 1 eth
        uint256 ethBalanceIncrease = ethReceiver.balance - initialEthBalance;
        assertEq(ethBalanceIncrease, ethTransferAmount);
    }

    /// @notice Validate proposal failed if quorum not met after voting period ended
    function testStateAfterVotingPeriodEnded() public {
        (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description,
            bytes32 descriptionHash
        ) = createDummyEthProposal(ethReceiver, 1 ether);

        uint256 proposalId = nopeDAO.propose(targets, values, calldatas, description);
        uint256 votingPeriod = nopeDAO.votingPeriod(); // measured in blocks

        // Fast forward to end of voting, add a buffer
        vm.roll(block.number + votingPeriod + 1000);

        // Verify state marked as failed
        assertEq(uint8(nopeDAO.state(proposalId)), 3); // Defeated

        // Verify can not execute proposal or vote on it
        vm.prank(userWithQuorumTribe);
        vm.expectRevert(bytes("Governor: vote not currently active"));
        nopeDAO.castVote(proposalId, 1);

        vm.expectRevert(bytes("Governor: proposal not successful"));
        nopeDAO.execute(targets, values, calldatas, descriptionHash);
    }
}
