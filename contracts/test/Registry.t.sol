// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "./utils/DSTest.sol";
import {Vm} from "./utils/Vm.sol";
import {MetadataRegistry} from "../pods/MetadataRegistry.sol";

contract MetadataRegistryTest is DSTest {
    MetadataRegistry registry;
    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        registry = new MetadataRegistry();
    }

    function testRegisterProposal() public {
        string
            memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        assertFalse(
            registry.isProposalRegistered(podId, proposalId, proposalMetadata)
        );
        registry.registerProposal(podId, proposalId, proposalMetadata);

        assertTrue(
            registry.isProposalRegistered(podId, proposalId, proposalMetadata)
        );
    }

    function testCanNotReRegisterProposal() public {
        string
            memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        registry.registerProposal(podId, proposalId, proposalMetadata);

        vm.expectRevert(bytes("Proposal already registered"));
        registry.registerProposal(podId, proposalId, proposalMetadata);
    }
}
