// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";

interface IPodFactory {
    /// @notice Configuration used when creating a pod
    /// @param members List of members to be added to the pod
    /// @param threshold Number of members that need to approve a transaction on the Gnosis safe
    /// @param label Metadata, Human readable label for the pod
    /// @param ensString Metadata, ENS name of the pod
    /// @param imageUrl Metadata, URL to a image to represent the pod in frontends
    /// @param minDelay Delay on the timelock
    struct PodConfig {
        address[] members;
        uint256 threshold;
        bytes32 label;
        string ensString;
        string imageUrl;
        address admin;
        uint256 minDelay;
    }

    event CreatePod(uint256 indexed podId, address indexed safeAddress, address indexed timelock);
    event CreateTimelock(address indexed timelock);
    event UpdatePodController(address indexed oldController, address indexed newController);

    event UpdateDefaultPodController(address indexed oldController, address indexed newController);

    function deployCouncilPod(PodConfig calldata _config)
        external
        returns (
            uint256,
            address,
            address
        );

    function defaultPodController() external view returns (ControllerV1);

    function getMemberToken() external view returns (MemberToken);

    function getPodSafeAddresses() external view returns (address[] memory);

    function getNumberOfPods() external view returns (uint256);

    function getPodController(uint256 podId) external view returns (ControllerV1);

    function getPodSafe(uint256 podId) external view returns (address);

    function getPodTimelock(uint256 podId) external view returns (address);

    function getNumMembers(uint256 podId) external view returns (uint256);

    function getPodMembers(uint256 podId) external view returns (address[] memory);

    function getPodThreshold(uint256 podId) external view returns (uint256);

    function getIsMembershipTransferLocked(uint256 podId) external view returns (bool);

    function getNextPodId() external view returns (uint256);

    function getPodAdmin(uint256 podId) external view returns (address);

    function createOptimisticPod(PodConfig calldata _config)
        external
        returns (
            uint256,
            address,
            address
        );

    function updateDefaultPodController(address _newDefaultController) external;
}
