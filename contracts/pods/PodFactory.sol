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

    /// @notice Address from which the admin pod transactions are sent. Likely a timelock
    address public podAdmin;

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
    event UpdatePodAdmin(address oldPodAdmin, address newPodAdmin);

    constructor(
        address _core,
        address _podAdmin,
        address _podController,
        address _memberToken,
        address _podExecutor
    ) CoreRef(_core) Ownable() {
        require(_core != address(0), "Zero address");
        /// @notice podAdmin can be set to zero address
        require(_podController != address(0x0), "Zero address");
        require(_podExecutor != address(0x0), "Zero address");

        podAdmin = _podAdmin;
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

    //////////////////////  SET POD ADMIN ///////////////////
    /// @notice Wrapper to allow current podAdmin to change the podAdmin
    function updatePodAdmin(uint256 _podId, address _podAdmin)
        external
        override
    {
        address oldPodAdmin = _podAdmin;
        emit UpdatePodAdmin(oldPodAdmin, _podAdmin);

        // Update local cached podAdmin
        podAdmin = _podAdmin;
        podController.updatePodAdmin(_podId, _podAdmin);
    }

    //////////////////// STATE-CHANGING API ////////////////////

    /// @notice Create a child Orca pod with optimistic timelock. Callable by the DAO and the Tribal Council
    /// @param _members List of members to be added to the pod
    /// @param _threshold Number of members that need to approve a transaction on the Gnosis safe
    /// @param _podLabel Metadata, Human readable label for the pod
    /// @param _ensString Metadata, ENS name of the pod
    /// @param _imageUrl Metadata, URL to a image to represent the pod in frontends
    /// @param minDelay Delay on the timelock
    // Can this be called off-chain? Or does it have to be calleable by the DAO/podAdmin?
    // Think need to be able to call this off-chain. Figure out permissioning to allow that
    // Want the various pods setup off chain, and then transfer ownership to the thing responsible for deploying more pods
    function createChildOptimisticPod(
        address[] calldata _members,
        uint256 _threshold,
        bytes32 _podLabel,
        string calldata _ensString,
        string calldata _imageUrl,
        uint256 minDelay
    ) external override onlyOwner returns (uint256, address) {
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
            address(core()),
            minDelay,
            proposers,
            executors
        );

        emit CreateOptimisticTimelock(address(timelock));
        emit CreatePod(podId, safeAddress);

        // Set mapping from podId to timelock for reference
        getPodTimelock[podId] = address(timelock);
        getPodId[address(timelock)] = podId;
        latestPodId = podId;
        return (podId, address(timelock));
    }
}
