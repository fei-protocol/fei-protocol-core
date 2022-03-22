// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IPodAdminGateway {
    error UnauthorisedAdminAction();

    event GrantPodAdminPriviledge(
        uint256 indexed podId,
        bytes32 indexed tribeRole
    );
    event RevokePodAdminPriviledge(
        uint256 indexed podId,
        bytes32 indexed tribeRole
    );
    event AddPodMember(uint256 indexed podId, address member);
    event RemovePodMember(uint256 indexed podId, address member);

    /// @notice Delineated admin priviledges available to the admin of an Orca pod
    enum AdminPriviledge {
        ADD_MEMBER,
        REMOVE_MEMBER
    }

    // Veto functionality
    event VetoTimelock(uint256 indexed podId, address indexed timelock);
}
