// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IPodFactory {
    function getPodSafe(uint256 podId) external view returns (address);

    function getNumMembers(uint256 podId) external view returns (uint256);

    function getPodMembers(uint256 podId)
        external
        view
        returns (address[] memory);

    function getPodThreshold(uint256 podId) external view returns (uint256);

    function getNextPodId() external view returns (uint256);

    function getPodAdmin(uint256 podId) external view returns (address);

    function createChildOptimisticPod(
        address[] calldata _members,
        uint256 _threshold,
        bytes32 _podLabel,
        string calldata _ensString,
        string calldata _imageUrl,
        uint256 minDelay,
        address podAdmin
    ) external returns (uint256, address);
}
