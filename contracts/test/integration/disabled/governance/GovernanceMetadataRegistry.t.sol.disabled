// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../../utils/DSTest.sol";
import {Vm} from "../../utils/Vm.sol";
import {TribeRoles} from "../../../core/TribeRoles.sol";
import {GovernanceMetadataRegistry} from "../../../pods/GovernanceMetadataRegistry.sol";
import {Core} from "../../../core/Core.sol";
import {MainnetAddresses} from "../fixtures/MainnetAddresses.sol";

contract GovernanceMetadataRegistryIntegrationTest is DSTest {
    GovernanceMetadataRegistry registry;
    Vm public constant vm = Vm(HEVM_ADDRESS);

    address priviledgedRegistrationAddress = address(0x10);

    function setUp() public {
        vm.startPrank(MainnetAddresses.FEI_DAO_TIMELOCK);
        Core(MainnetAddresses.CORE).createRole(TribeRoles.POD_METADATA_REGISTER_ROLE, TribeRoles.GOVERNOR);
        Core(MainnetAddresses.CORE).grantRole(TribeRoles.POD_METADATA_REGISTER_ROLE, priviledgedRegistrationAddress);
        vm.stopPrank();

        registry = new GovernanceMetadataRegistry(MainnetAddresses.CORE);
    }

    function testRegisterProposal() public {
        string memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        assertFalse(registry.isProposalRegistered(podId, proposalId, proposalMetadata));

        vm.prank(priviledgedRegistrationAddress);
        registry.registerProposal(podId, proposalId, proposalMetadata);

        assertTrue(registry.isProposalRegistered(podId, proposalId, proposalMetadata));
    }

    function testRegisterFailsIfIncorrectRole() public {
        string memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        vm.expectRevert(bytes("UNAUTHORIZED"));
        registry.registerProposal(podId, proposalId, proposalMetadata);
    }

    function testCanNotReRegisterProposal() public {
        string memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        vm.prank(priviledgedRegistrationAddress);
        registry.registerProposal(podId, proposalId, proposalMetadata);

        vm.expectRevert(bytes("Proposal already registered"));
        vm.prank(priviledgedRegistrationAddress);
        registry.registerProposal(podId, proposalId, proposalMetadata);
    }
}
