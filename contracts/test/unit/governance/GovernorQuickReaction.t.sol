// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {NopeDAO} from "../../../dao/nopeDAO/NopeDAO.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {DummyStorage, createDummyStorageVarProposal, getDAOMembers} from "../../utils/GovFixtures.sol";
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

        ) = createDummyStorageVarProposal(address(this), 1 ether);

        proposalId = nopeDAO.propose(targets, values, calldatas, description);
        vm.roll(block.number + 1); // Make block number non-zero, for getVotes accounting
    }

    /// @notice Validate that a pending proposal can not be executed
    function testCanNotExecutePendingProposal() public {}

    /// @notice Validate that an active proposal with quorum not met, can not be executed
    function testCanNotExecuteActiveUnsuccessfulProposal() public {}

    /// @notice Validate can quick reaction execute successful proposal
    function testQuickReactionProposal() public {}
}
