// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TribeRoles} from "../core/TribeRoles.sol";
import {OptimisticTimelock} from "../dao/timelock/OptimisticTimelock.sol";
import {CoreRef} from "../refs/CoreRef.sol";

import {IControllerV1} from "../pods/interfaces/IControllerV1.sol";
import {IMemberToken} from "../pods/interfaces/IMemberToken.sol";

// TODO: Maybe this just becomes a factory for help in deploying/creating pods?
/// @notice Contract used by an Admin pod to manage child pods.
/// Responsibilities include:
/// - Create a child pod
/// - Authorise the child with specific permissions over parts of the protocol
/// - Add or remove child pod members
/// One of these contracts should be deployed per admin pod.
/// All state changing methods are callable by the DAO or admin pod.
contract PodAdminManager is CoreRef {
    /// @notice Address from which the admin pod transactions will be sent. Likely a timelock
    address immutable adminPod;

    /// @notice Orca controller for Pod
    IControllerV1 private immutable podController;

    /// @notice Membership token for the pod
    IMemberToken private immutable memberToken;

    bytes32 private constant GOVERN_ROLE = keccak256("GOVERN_ROLE");
    bytes32 private constant GUARDIAN_ROLE = keccak256("GUARDIAN_ROLE");
    bytes32 private constant TRIBAL_COUNCIL_ROLE =
        keccak256("TRIBAL_COUNCIL_ROLE");
    bytes32 private constant GUARDIAN = keccak256("GUARDIAN_ROLE");

    event CreatePod(uint256 podId, address safeAddress);
    event AddPodMember(uint256 podId, address member);
    event RemovePodMember(uint256 podId, address member);

    modifier onlyAdmin() {
        require(msg.sender == adminPod, "UNAUTHORISED");
        _;
    }

    constructor(
        address _core,
        address _podAdmin,
        address _podController,
        address _memberToken
    ) CoreRef(_core) {
        require(_core != address(0x0), "Zero address");
        require(_podAdmin != address(0x0), "Zero address");
        require(_podController != address(0x0), "Zero address");
        // TODO: Validate that the supplied _podAdmin has the Tribal Council role
        // Have to enforce that this Manager contract belongs to the Tribal Council
        adminPod = _podAdmin;
        podController = IControllerV1(_podController);
        memberToken = IMemberToken(_memberToken);
    }

    ///////////////////// GETTERS ///////////////////////
    function getPodSafe(uint256 podId) external view returns (address) {
        return podController.podIdToSafe(podId);
    }

    //////////////////// STATE-CHANGING API ////////////////////

    /// @notice Create a child Orca pod. Callable by the DAO and the Tribal Council
    /// @dev Returns the podId and the address of the optimistic timelock
    function createChildPod(
        address[] memory _members,
        uint256 _threshold,
        bytes32 _podLabel,
        string memory _ensString,
        string memory _imageUrl,
        uint256 minDelay
    ) public returns (uint256, address) {
        uint256 podId = memberToken.getNextAvailablePodId();
        podController.createPod(
            _members,
            _threshold,
            adminPod,
            _podLabel,
            _ensString,
            podId,
            _imageUrl
        );
        address safeAddress = podController.podIdToSafe(podId);
        address timelock = createOptimisticTimelock(
            address(core()),
            safeAddress,
            safeAddress,
            minDelay
        );

        emit CreatePod(podId, safeAddress);
        return (podId, timelock);
    }

    /// @notice Create an Optimistic timelock, with a proposer and executor
    function createOptimisticTimelock(
        address _core,
        address proposer,
        address executor,
        uint256 minDelay
    ) internal returns (address) {
        address[] memory proposers = new address[](1);
        proposers[0] = proposer;

        address[] memory executors = new address[](1);
        executors[0] = executor;

        OptimisticTimelock timelock = new OptimisticTimelock(
            _core,
            minDelay,
            proposers,
            executors
        );
        return address(timelock);
    }

    /// @notice Create a child orca pod and assign it authorisation over parts of the protocol
    function createChildPodWithRoles(
        address[] memory _members,
        uint256 _threshold,
        bytes32 _podLabel,
        string memory _ensString,
        string memory _imageUrl,
        uint256 minDelay,
        bytes32[] memory _roles
    )
        external
        hasAnyOfTwoRoles(GOVERN_ROLE, TRIBAL_COUNCIL_ROLE)
        returns (uint256)
    {
        (uint256 podId, address timelock) = createChildPod(
            _members,
            _threshold,
            _podLabel,
            _ensString,
            _imageUrl,
            minDelay
        );

        for (uint256 i = 0; i < _roles.length; i += 1) {
            grantAdminRole(timelock, _roles[i]);
        }

        return podId;
    }

    // TODO
    /// @notice Add a member to a child pod
    function addChildPodMember(uint256 podId, address member)
        external
        hasAnyOfTwoRoles(GOVERN_ROLE, TRIBAL_COUNCIL_ROLE)
    {
        emit AddPodMember(podId, member);
        // TODO
    }

    // TODO
    /// @notice Remove a member from a child pod. Can be called also by the Guardian as a safety mechanism
    function removeChildPodMember(uint256 podId, address member)
        external
        hasAnyOfThreeRoles(GOVERN_ROLE, TRIBAL_COUNCIL_ROLE, GUARDIAN)
    {
        emit RemovePodMember(podId, member);
        // memberToken.burn(member, podId);
    }

    // TODO
    /// @notice Grant an admin role to the pod. Authorised by either the DAO or the Tribal Council
    function grantAdminRole(address timelock, bytes32 role)
        public
        hasAnyOfTwoRoles(GOVERN_ROLE, TRIBAL_COUNCIL_ROLE)
    {}
}
