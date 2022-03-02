// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {OptimisticTimelock} from "../../dao/timelock/OptimisticTimelock.sol";
import {IControllerV1} from "../../pods/interfaces/IControllerV1.sol";
import {IMemberToken} from "../../pods/interfaces/IMemberToken.sol";
import {IInviteToken} from "../../pods/interfaces/IInviteToken.sol";

import {Vm} from "../utils/Vm.sol";
import {DSTest} from "../utils/DSTest.sol";

contract OptimisticPodTest is DSTest {
    // Mainnet addresses
    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private podControllerAddress =
        0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberTokenAddress =
        0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;

    // Used in the Beta rollout to permission who can call the pod
    address private shipTokenAddress =
        0x872EdeaD0c56930777A82978d4D7deAE3A2d1539;
    address private priviledgedShipAddress =
        0x2149A222feD42fefc3A120B3DdA34482190fC666;

    OptimisticTimelock timelock;
    IMemberToken memberToken = IMemberToken(memberTokenAddress);
    IControllerV1 controller = IControllerV1(podControllerAddress);
    IInviteToken inviteToken = IInviteToken(shipTokenAddress);

    address proposer = address(0x1);
    address executor = address(0x2);
    address podAdmin = address(0x3);

    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        address[] memory proposers = new address[](1);
        proposers[0] = proposer;

        address[] memory executors = new address[](1);
        executors[0] = executor;
        timelock = new OptimisticTimelock(core, 0, proposers, executors);

        // Mint SHIP to self - needed to create a Pod
        vm.prank(priviledgedShipAddress);
        inviteToken.mint(address(this), 1);
    }

    function testCreatePod() public {
        // Members of the pod
        address[] memory members = new address[](3);
        members[0] = address(0x4);
        members[1] = address(0x5);
        members[2] = address(0x6);

        // Number of members required to sign a transaction
        uint256 threshold = 2;
        bytes32 podLabel = bytes32("hellopod");
        string memory ensString = "hellopod.eth";
        string memory imageUrl = "hellopod.come";

        // Get the next podId
        uint256 expectedPodId = memberToken.getNextAvailablePodId();

        controller.createPod(
            members,
            threshold,
            podAdmin,
            podLabel,
            ensString,
            expectedPodId,
            imageUrl
        );
    }

    function testLinkOptimisticTimelock() public {}
}
