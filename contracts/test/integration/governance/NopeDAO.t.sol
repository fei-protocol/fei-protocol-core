// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {NopeDAO} from "../../../dao/NopeDAO.sol";
import {Core} from "../../../core/Core.sol";

contract NopeDAOIntegrationTest is DSTest {
    address user = address(0x1);
    uint256 excessQuorumTribe = (11e6) * (10**18);

    NopeDAO nopeDAO;
    Core core = Core(0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9);
    address feiDAOTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;
    ERC20VotesComp tribe =
        ERC20VotesComp(0xc7283b66Eb1EB5FB86327f08e1B5816b0720212B);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        nopeDAO = new NopeDAO(tribe);

        // Transfer Tribe from treasury to a user
        vm.prank(feiDAOTimelock);
        core.allocateTribe(user, excessQuorumTribe);

        // Self-delegate that Tribe
        vm.prank(user);
        tribe.delegate(user);

        // Create POD_VETO_ADMIN role and grant to NopeDAO
        vm.startPrank(feiDAOTimelock);
        core.createRole(TribeRoles.POD_VETO_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.POD_VETO_ADMIN, address(nopeDAO));
        vm.stopPrank();
    }

    /// @notice Validate that inital setup worked
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.POD_VETO_ADMIN, address(nopeDAO)));
    }

    /// @notice Validate that the NopeDAO can veto a pod
    function testNope() public {
        // Should the DAO be able to have proposals created that will do things outside of the
        // FEI ecosystem?
        // Flow to Nope
        // 1. Proposal created in a pod
        // 2. Pod proposal goes to timelock
        // 3. Proposal created on NopeDAO
        // 4. Proposal voted for on NopeDAO
        // 5. Transaction sent to pod timelock that cancels the relevant proposal
    }

    /// @notice Validate that NopeDAO can not create or execute any other proposal
    function testCanNotPassAnyOtherProposal() public {
        // How to do?
        // restrict the proposal function signatures it can target?
        // limit the roles that are granted to it?
        //
    }
}
