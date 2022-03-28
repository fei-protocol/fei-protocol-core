// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {ERC20VotesComp} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20VotesComp.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {NopeDAO} from "../../../dao/NopeDAO.sol";
import {Core} from "../../../core/Core.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {getMainnetAddresses, MainnetAddresses} from "../fixtures/MainnetAddresses.sol";
import {deployPodWithFactory} from "../fixtures/Orca.sol";

contract NopeDAOIntegrationTest is DSTest {
    uint256 excessQuorumTribe = (11e6) * (10**18);
    address private user = address(0x1);
    address private podExecutor = address(0x2);
    address private podAdmin = address(0x3);

    NopeDAO nopeDAO;
    PodFactory factory;
    MainnetAddresses mainnetAddresses = getMainnetAddresses();
    Core core = Core(mainnetAddresses.core);
    ERC20VotesComp tribe = ERC20VotesComp(mainnetAddresses.tribe);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        nopeDAO = new NopeDAO(tribe);

        // Transfer Tribe from treasury to a user
        vm.prank(mainnetAddresses.feiDAOTimelock);
        core.allocateTribe(user, excessQuorumTribe);

        // Self-delegate that Tribe
        vm.prank(user);
        tribe.delegate(user);

        // Create POD_VETO_ADMIN role and grant to NopeDAO
        vm.startPrank(mainnetAddresses.feiDAOTimelock);
        core.createRole(TribeRoles.POD_VETO_ADMIN, TribeRoles.GOVERNOR);
        core.grantRole(TribeRoles.POD_VETO_ADMIN, address(nopeDAO));
        vm.stopPrank();

        // Create pod, using a podFactory
        (uint256 podId, address podTimelock) = deployPodWithFactory(
            mainnetAddresses.core,
            mainnetAddresses.podController,
            mainnetAddresses.memberToken,
            podExecutor,
            podAdmin,
            vm,
            mainnetAddresses.feiDAOTimelock
        );
    }

    /// @notice Validate that inital setup worked
    function testInitialState() public {
        assertTrue(core.hasRole(TribeRoles.POD_VETO_ADMIN, address(nopeDAO)));
    }

    /// @notice Validate that the NopeDAO can veto a pod
    function testNope() public {
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
