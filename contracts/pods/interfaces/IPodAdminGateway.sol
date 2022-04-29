// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IPodAdminGateway {
    event AddPodMember(uint256 indexed podId, address member);
    event RemovePodMember(uint256 indexed podId, address member);
    event UpdatePodAdmin(uint256 indexed podId, address oldPodAdmin, address newPodAdmin);
    event PodMembershipTransferLock(uint256 indexed podId, bool lock);

    // Veto functionality
    event VetoTimelock(uint256 indexed podId, address indexed timelock, bytes32 proposalId);

    function getSpecificPodAdminRole(uint256 _podId) external pure returns (bytes32);

    function getSpecificPodGuardianRole(uint256 _podId) external pure returns (bytes32);

    function addPodMember(uint256 _podId, address _member) external;

    function batchAddPodMember(uint256 _podId, address[] calldata _members) external;

    function removePodMember(uint256 _podId, address _member) external;

    function batchRemovePodMember(uint256 _podId, address[] calldata _members) external;

    function lockMembershipTransfers(uint256 _podId) external;

    function unlockMembershipTransfers(uint256 _podId) external;

    function veto(uint256 _podId, bytes32 proposalId) external;
}
