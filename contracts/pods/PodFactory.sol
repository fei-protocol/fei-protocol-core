// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IGnosisSafe} from "./orcaInterfaces/IGnosisSafe.sol";
import {IControllerV1} from "./orcaInterfaces/IControllerV1.sol";
import {IMemberToken} from "./orcaInterfaces/IMemberToken.sol";
import {IPodFactory} from "./IPodFactory.sol";

import {TribeRoles} from "../core/TribeRoles.sol";
import {OptimisticTimelock} from "../dao/timelock/OptimisticTimelock.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @notice Contract used by an Admin pod to manage child pods.

/// @dev This contract is primarily a factory contract which an admin
/// can use to deploy more optimistic governance pods. It will create an
/// Orca pod and deploy an optimistic timelock alongside it.
///
/// The timelock and Orca pod are then linked up so that the Orca pod is
/// the only proposer and executor.
contract PodFactory is CoreRef, Ownable, IPodFactory {
    /// @notice TRIBE roles used for permissioning
    bytes32 public constant GOVERN_ROLE = keccak256("GOVERN_ROLE");
    bytes32 public constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 public constant ROLE_ADMIN = keccak256("ROLE_ADMIN");

    /// @notice Orca controller for Pod
    IControllerV1 private immutable podController;

    /// @notice Orca membership token for the pod
    IMemberToken private immutable memberToken;

    /// @notice Public contract that will be granted to execute all timelocks created
    address public immutable podExecutor;

    /// @notice Mapping between podId and it's optimistic timelock
    mapping(uint256 => address) public getPodTimelock;

    /// @notice Mapping between timelock and podId
    mapping(address => uint256) public getPodId;

    /// @notice Latest pod created
    uint256 public latestPodId;

    event CreatePod(uint256 podId, address safeAddress);
    event CreateOptimisticTimelock(address timelock);

    constructor(
        address _core,
        address _podController,
        address _memberToken,
        address _podExecutor
    ) CoreRef(_core) Ownable() {
        require(_core != address(0), "Zero address");
        require(_podController != address(0x0), "Zero address");
        require(_podExecutor != address(0x0), "Zero address");

        podExecutor = _podExecutor;
        podController = IControllerV1(_podController);
        // TODO: Checkout what happens when migrate controller. Probs need to update pointer here
        memberToken = IMemberToken(_memberToken);
    }

    ///////////////////// GETTERS ///////////////////////

    /// @notice Get the address of the Gnosis safe that represents a pod
    /// @param podId Unique id for the orca pod
    function getPodSafe(uint256 podId) public view override returns (address) {
        return podController.podIdToSafe(podId);
    }

    /// @notice Get the number of pod members
    function getNumMembers(uint256 podId)
        external
        view
        override
        returns (uint256)
    {
        address safe = getPodSafe(podId);
        address[] memory members = IGnosisSafe(safe).getOwners();
        return uint256(members.length);
    }

    /// @notice Get all members on the pod
    function getPodMembers(uint256 podId)
        public
        view
        override
        returns (address[] memory)
    {
        address safeAddress = podController.podIdToSafe(podId);
        return IGnosisSafe(safeAddress).getOwners();
    }

    /// @notice Get the signer threshold on the pod
    function getPodThreshold(uint256 podId)
        external
        view
        override
        returns (uint256)
    {
        address safe = getPodSafe(podId);
        uint256 threshold = uint256(IGnosisSafe(safe).getThreshold());
        return threshold;
    }

    /// @notice Get the next pod id
    function getNextPodId() external view override returns (uint256) {
        return memberToken.getNextAvailablePodId();
    }

    /// @notice Get the podAdmin from the base Orca controller. Controller only allows existing admin to change
    function getPodAdmin(uint256 podId)
        external
        view
        override
        returns (address)
    {
        return IControllerV1(podController).podAdmin(podId);
    }

    //////////////////// STATE-CHANGING API ////////////////////

    /// @notice Create a child Orca pod with optimistic timelock. Callable by the DAO and the Tribal Council
    /// @param _members List of members to be added to the pod
    /// @param _threshold Number of members that need to approve a transaction on the Gnosis safe
    /// @param _podLabel Metadata, Human readable label for the pod
    /// @param _ensString Metadata, ENS name of the pod
    /// @param _imageUrl Metadata, URL to a image to represent the pod in frontends
    /// @param _minDelay Delay on the timelock
    /// @param _podAdmin The admin of the pod - able to add and remove pod members
    function createChildOptimisticPod(
        address[] calldata _members,
        uint256 _threshold,
        bytes32 _podLabel,
        string calldata _ensString,
        string calldata _imageUrl,
        uint256 _minDelay,
        address _podAdmin
    ) external override onlyOwner returns (uint256, address) {
        uint256 podId = memberToken.getNextAvailablePodId();

        address safeAddress = createPod(
            _members,
            _threshold,
            _podLabel,
            _ensString,
            _imageUrl,
            _podAdmin,
            podId
        );

        address timelock = createOptimisticTimelock(
            safeAddress,
            _minDelay,
            podExecutor
        );

        // Set mapping from podId to timelock for reference
        getPodTimelock[podId] = timelock;
        getPodId[timelock] = podId;
        latestPodId = podId;

        emit CreatePod(podId, safeAddress);
        return (podId, timelock);
    }

    /// @notice Create an Orca pod - a Gnosis Safe with a membership wrapper
    function createPod(
        address[] calldata _members,
        uint256 _threshold,
        bytes32 _podLabel,
        string calldata _ensString,
        string calldata _imageUrl,
        address _podAdmin,
        uint256 podId
    ) internal returns (address) {
        podController.createPod(
            _members,
            _threshold,
            _podAdmin,
            _podLabel,
            _ensString,
            podId,
            _imageUrl
        );
        return podController.podIdToSafe(podId);
    }

    /// @notice Create an optimistic timelock, linking to an Orca pod
    /// @dev Make a pod safe address the proposer and an executor. Execution is made public through
    ///      a public executor
    function createOptimisticTimelock(
        address safeAddress,
        uint256 minDelay,
        address publicExecutor
    ) internal returns (address) {
        address[] memory proposers = new address[](1);
        proposers[0] = safeAddress;

        address[] memory executors = new address[](2);
        executors[0] = safeAddress;
        executors[1] = publicExecutor;

        OptimisticTimelock timelock = new OptimisticTimelock(
            address(core()),
            minDelay,
            proposers,
            executors
        );
        emit CreateOptimisticTimelock(address(timelock));
        return address(timelock);
    }
}
