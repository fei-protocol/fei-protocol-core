// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../core/Core.sol";
import {Vm} from "../utils/Vm.sol";
import {DSTest} from "../utils/DSTest.sol";
import {NopeDAO} from "../../dao/NopeDAO.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../utils/Fixtures.sol";
import {Tribe} from "../../tribe/Tribe.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";

/// @notice Dummy contract to test NopeDAO proposals
contract DummyStorage {
    uint256 private variable = 5;

    function getVariable() external view returns (uint256) {
        return variable;
    }

    function setVariable(uint256 x) external {
        variable = x;
    }
}

// TODO:
// 1. Run the test proposal against a dummy contract
// 2. Validate that the NopeDAO can not update it's own parameters
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
        assertEq(votingDelay, 1);

        uint256 votingPeriod = nopeDAO.votingPeriod();
        uint256 fourDays = 86400 * 4;
        assertEq(votingPeriod, fourDays);

        uint256 proposalThreshold = nopeDAO.proposalThreshold();
        assertEq(proposalThreshold, 0);

        address token = address(nopeDAO.token());
        assertEq(token, tribeAddress);

        uint256 userVoteWeight = tribe.getCurrentVotes(user);
        assertEq(userVoteWeight, excessQuorumTribe);
    }

    /// @notice Validate that a DAO proposal can be executed.
    ///         Specifically, targets a dummy mock contract
    function testProposalExecutes() public {
        DummyStorage dummyStorageContract = new DummyStorage();
        assertEq(dummyStorageContract.getVariable(), uint256(5));

        // Make block number non-zero, for getVotes accounting
        vm.roll(1000);

        address[] memory targets = new address[](1);
        targets[0] = address(dummyStorageContract);

        uint256[] memory values = new uint256[](1);
        values[0] = uint256(0);

        uint256 newVariable = 10;
        bytes[] memory calldatas = new bytes[](1);
        bytes memory data = abi.encodePacked(
            bytes4(keccak256(bytes("setVariable(uint256)"))),
            newVariable
        );
        calldatas[0] = data;

        string memory description = "Dummy proposal";
        bytes32 descriptionHash = keccak256(bytes(description));

        vm.prank(user);
        uint256 proposalId = nopeDAO.propose(
            targets,
            values,
            calldatas,
            description
        );

        // Advance past the 1 voting block
        vm.roll(1100);

        // Cast a vote for the proposal, in excess of quorum
        vm.prank(user);
        nopeDAO.castVote(proposalId, 1);

        // Skip to end of voting
        uint256 votingEndBlock = nopeDAO.proposalDeadline(proposalId);
        vm.roll(votingEndBlock + 1);

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
