// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {Core} from "../../../core/Core.sol";
import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {NopeDAO} from "../../../dao/nopeDAO/NopeDAO.sol";
import {getCore, getAddresses, FeiTestAddresses} from "../../utils/Fixtures.sol";
import {DummyStorage, createDummyStorageVarProposal} from "../../utils/GovFixtures.sol";
import {Tribe} from "../../../tribe/Tribe.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";

/// @dev Validates vote counting functionality of the GovernorCountingFor module. Module is abstract
///      so instantiated as a NopeDAO
contract GovernorCountingForTest is DSTest {
    address userWithQuorumTribe = address(0x1);
    address userWith5MTribe = address(0x2);
    address userWith2MTribe = address(0x3);
    address userWithZeroTribe = address(0x4);

    uint256 excessQuorumTribe = (11e6) * (10**18);
    ERC20VotesComp tribe;

    Vm public constant vm = Vm(HEVM_ADDRESS);
    NopeDAO private nopeDAO;
    Core private core;

    FeiTestAddresses public addresses = getAddresses();
    uint256 proposalId;

    function setUp() public {
        // 1. Setup core
        core = getCore();

        // 2. Setup Tribe, grant to test addresses and delegate
        vm.startPrank(addresses.governorAddress);
        core.allocateTribe(userWithQuorumTribe, excessQuorumTribe);
        core.allocateTribe(userWith5MTribe, 5e6 * (10**18));
        core.allocateTribe(userWith2MTribe, 2e6 * (10**18));
        vm.stopPrank();

        tribe = ERC20VotesComp(address(core.tribe()));

        // Delegate TRIBE to users, allowing them to vote
        vm.prank(userWithQuorumTribe);
        tribe.delegate(userWithQuorumTribe);

        vm.prank(userWith5MTribe);
        tribe.delegate(userWith5MTribe);

        vm.prank(userWith2MTribe);
        tribe.delegate(userWith2MTribe);

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
}
