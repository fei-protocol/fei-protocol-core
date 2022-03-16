// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IMultiPodAdmin {
    error UnauthorisedAdminAction();

    event GrantPodAdminPriviledge(
        uint256 indexed podId,
        bytes32 indexed tribeRole
    );
    event RevokePodAdminPriviledge(
        uint256 indexed podId,
        bytes32 indexed tribeRole
    );

    /// @notice Delineated admin priviledges available to the admin of an Orca pod
    enum AdminPriviledge {
        ADD_MEMBER,
        REMOVE_MEMBER
    }
}
