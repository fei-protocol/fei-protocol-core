// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../utils/DSTest.sol";
import {Vm} from "../utils/Vm.sol";
import {GovernanceMetadataRegistry} from "../../pods/GovernanceMetadataRegistry.sol";

contract MetadataRegistryIntegrationTest is DSTest {
    GovernanceMetadataRegistry registry;
    Vm public constant vm = Vm(HEVM_ADDRESS);

    function setUp() public {
        address _core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
        registry = new GovernanceMetadataRegistry(_core);
    }

    function testRegisterProposal() public {
        string
            memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        assertFalse(
            registry.isProposalRegistered(podId, proposalId, proposalMetadata)
        );

        // TODO: Only allow pods to register proposals, to limit DDOS
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

        // TODO: Only allow pod Gnosis Safes to register proposals, to limit DDOS
        registry.registerProposal(podId, proposalId, proposalMetadata);

        vm.expectRevert(bytes("Proposal already registered"));
        registry.registerProposal(podId, proposalId, proposalMetadata);
    }
}
