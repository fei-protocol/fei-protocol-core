// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {Vm} from "../../utils/Vm.sol";
import {DSTest} from "../../utils/DSTest.sol";
import {PodFactory} from "../../../pods/PodFactory.sol";
import {MultiPodAdmin} from "../../../pods/MultiPodAdmin.sol";
import {mintOrcaTokens, getPodParams} from "../fixtures/Orca.sol";
import {IPodFactory} from "../../../pods/IPodFactory.sol";

contract MultiPodAdminIntegrationTest is DSTest {
    Vm public constant vm = Vm(HEVM_ADDRESS);

    PodFactory factory;
    MultiPodAdmin multiPodAdmin;

    address private core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
    address private podController = 0xD89AAd5348A34E440E72f5F596De4fA7e291A3e8;
    address private memberToken = 0x0762aA185b6ed2dCA77945Ebe92De705e0C37AE3;
    address private feiDAOTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;
    address private podExecutor = address(0x500);

    function setUp() public {
        // 1.0 Deploy pod factory
        factory = new PodFactory(core, podController, memberToken, podExecutor);

        // 2.0 Deploy multi-pod admin contract, to expose pod admin functionality
        multiPodAdmin = new MultiPodAdmin(core, memberToken);

        // 3.0 Make config for pod, mint Orca tokens to factory
        (
            IPodFactory.PodConfig memory podConfig,
            uint256 minDelay
        ) = getPodParams(address(multiPodAdmin));
        mintOrcaTokens(address(factory), 2, vm);

        // 4.0 Create pod
        vm.prank(feiDAOTimelock);
        (uint256 podId, address timelock) = factory.createChildOptimisticPod(
            podConfig,
            minDelay
        );
    }

    function testAddPodAdmin() public {}

    function testRemovePodAdmin() public {}

    function testExposedPodAdminCanAddMembers() public {}

    function testExposedPodAdminCanRemoveMembers() public {}

    function testNonExposedAdminFailsToRemove() public {}
}
