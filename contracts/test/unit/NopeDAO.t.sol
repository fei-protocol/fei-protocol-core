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

contract NopeDAOTest is DSTest {
    address user = address(0x1);
    uint256 excessQuorumTribe = (11e6) * (10**18);
    address tribeAddress;

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

        ERC20VotesComp tribe = ERC20VotesComp(tribeAddress);
        tribe.delegate(tribeAddress);

        // 3. Deploy NopeDAO
        nopeDAO = new NopeDAO(tribe);
    }

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
    }
}
