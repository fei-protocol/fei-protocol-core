// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IPodAdminGateway {
    event AddPodMember(uint256 indexed podId, address member);
    event RemovePodMember(uint256 indexed podId, address member);
    event UpdatePodAdmin(
        uint256 indexed podId,
        address oldPodAdmin,
        address newPodAdmin
    );

    // Veto functionality
    event VetoTimelock(uint256 indexed podId, address indexed timelock);
}
