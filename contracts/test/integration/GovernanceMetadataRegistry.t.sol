// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {DSTest} from "../utils/DSTest.sol";
import {Vm} from "../utils/Vm.sol";
import {TribeRoles} from "../../core/TribeRoles.sol";
import {GovernanceMetadataRegistry} from "../../pods/GovernanceMetadataRegistry.sol";
import {Core} from "../../core/Core.sol";

contract GovernanceMetadataRegistryIntegrationTest is DSTest {
    GovernanceMetadataRegistry registry;
    Vm public constant vm = Vm(HEVM_ADDRESS);

    address priviledgedRegistrationAddress = address(0x10);

    function setUp() public {
        address _core = 0x8d5ED43dCa8C2F7dFB20CF7b53CC7E593635d7b9;
        address feiDAOTimelock = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;

        vm.startPrank(feiDAOTimelock);
        Core(_core).createRole(
            TribeRoles.POD_METADATA_REGISTER_ROLE,
            TribeRoles.GOVERNOR
        );
        Core(_core).grantRole(
            TribeRoles.POD_METADATA_REGISTER_ROLE,
            priviledgedRegistrationAddress
        );
        vm.stopPrank();

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

        vm.prank(priviledgedRegistrationAddress);
        registry.registerProposal(podId, proposalId, proposalMetadata);

        assertTrue(
            registry.isProposalRegistered(podId, proposalId, proposalMetadata)
        );
    }

    function testRegisterFailsIfIncorrectRole() public {
        string
            memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        vm.expectRevert(bytes("UNAUTHORIZED"));
        registry.registerProposal(podId, proposalId, proposalMetadata);
    }

    function testCanNotReRegisterProposal() public {
        string
            memory proposalMetadata = "FIP_X: Perform Upgrade. This FIP will upgrade the contracts in the...";
        uint256 podId = uint256(1);
        uint256 proposalId = uint256(1);

        vm.prank(priviledgedRegistrationAddress);
        registry.registerProposal(podId, proposalId, proposalMetadata);

        vm.expectRevert(bytes("Proposal already registered"));
        vm.prank(priviledgedRegistrationAddress);
        registry.registerProposal(podId, proposalId, proposalMetadata);
    }
}
