// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IControllerV1 {
    function createPod(
        address[] memory _members,
        uint256 threshold,
        address _admin,
        bytes32 _label,
        string memory _ensString,
        uint256 expectedPodId,
        string memory _imageUrl
    ) external;
}
