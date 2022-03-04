// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TribeRoles} from "../core/TribeRoles.sol";
import {OptimisticTimelock} from "../dao/timelock/OptimisticTimelock.sol";

import {IControllerV1} from "../pods/interfaces/IControllerV1.sol";
import {IMemberToken} from "../pods/interfaces/IMemberToken.sol";

/// @notice Contract used by an Admin pod to manage child pods.

/// @dev This contract is primarily a factory contract which an admin
/// can use to deploy more optimistic governance pods. It will create an
/// Orca pod and deploy an optimistic timelock alongside it.
///
/// The timelock and Orca pod are then linked up so that the Orca pod is
/// the only proposer and executor.
contract PodFactory {
    /// @notice Address from which the admin pod transactions are sent. Likely a timelock
    address private immutable podAdmin;

    /// @notice Orca controller for Pod
    IControllerV1 private immutable podController;

    /// @notice Orca membership token for the pod
    IMemberToken private immutable memberToken;

    /// @notice Fei core address
    address private immutable core;

    /// @notice Public contract that will be granted to execute all timelocks created
    address public immutable podExecutor;

    /// @notice Mapping between podId and it's optimistic timelock
    mapping(uint256 => address) public getPodTimelock;

    event CreatePod(uint256 podId, address safeAddress);
    event CreateOptimisticTimelock(address timelock);

    /// @notice Restrict function calls to podAdmin
    modifier onlyPodAdmin() {
        require(msg.sender == podAdmin, "Only PodAdmin can deploy");
        _;
    }

    constructor(
        address _core,
        address _podAdmin,
        address _podController,
        address _memberToken,
        address _podExecutor
    ) {
        require(_core != address(0), "Zero address");
        require(_podAdmin != address(0x0), "Zero address");
        require(_podController != address(0x0), "Zero address");
        require(_podExecutor != address(0x0), "Zero address");

        core = _core;
        podAdmin = _podAdmin;
        podExecutor = _podExecutor;
        podController = IControllerV1(_podController);
        memberToken = IMemberToken(_memberToken);
    }

    ///////////////////// GETTERS ///////////////////////

    /// @notice Get the address of the Gnosis safe that represents a pod
    /// @param podId Unique id for the orca pod
    function getPodSafe(uint256 podId) external view returns (address) {
        return podController.podIdToSafe(podId);
    }

    //////////////////// STATE-CHANGING API ////////////////////

    /// @notice Create a child Orca pod. Callable by the DAO and the Tribal Council
    /// @param _members List of members to be added to the pod
    /// @param _threshold Number of members that need to approve a transaction on the Gnosis safe
    /// @param _podLabel Metadata, Human readable label for the pod
    /// @param _ensString Metadata, ENS name of the pod
    /// @param _imageUrl Metadata, URL to a image to represent the pod in frontends
    /// @param minDelay Delay on the timelock
    function createChildOptimisticPod(
        address[] calldata _members,
        uint256 _threshold,
        bytes32 _podLabel,
        string calldata _ensString,
        string calldata _imageUrl,
        uint256 minDelay
    ) external onlyPodAdmin returns (uint256, address) {
        uint256 podId = memberToken.getNextAvailablePodId();

        podController.createPod(
            _members,
            _threshold,
            podAdmin,
            _podLabel,
            _ensString,
            podId,
            _imageUrl
        );
        address safeAddress = podController.podIdToSafe(podId);

        address[] memory proposers = new address[](1);
        proposers[0] = safeAddress;

        address[] memory executors = new address[](2);
        executors[0] = safeAddress;
        executors[1] = podExecutor;

        OptimisticTimelock timelock = new OptimisticTimelock(
            core,
            minDelay,
            proposers,
            executors
        );

        emit CreateOptimisticTimelock(address(timelock));
        emit CreatePod(podId, safeAddress);

        // Set mapping from podId to timelock for reference
        getPodTimelock[podId] = address(timelock);
        return (podId, address(timelock));
    }
}
