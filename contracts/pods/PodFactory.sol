// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IGnosisSafe} from "./orcaInterfaces/IGnosisSafe.sol";
import {IControllerV1} from "./orcaInterfaces/IControllerV1.sol";
import {IMemberToken} from "./orcaInterfaces/IMemberToken.sol";
import {IPodFactory} from "./IPodFactory.sol";

import {TribeRoles} from "../core/TribeRoles.sol";
import {OptimisticTimelock} from "../dao/timelock/OptimisticTimelock.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";

/// @notice Contract used by an Admin pod to manage child pods.

/// @dev This contract is primarily a factory contract which an admin
/// can use to deploy more optimistic governance pods. It will create an
/// Orca pod and deploy an optimistic timelock alongside it.
///
/// The timelock and Orca pod are then linked up so that the Orca pod is
/// the only proposer and executor.
contract PodFactory is CoreRef, IPodFactory {
    /// @notice Tribe roles governing deployment of pods
    bytes32 internal constant GOVERN_ROLE = keccak256("GOVERN_ROLE");
    bytes32 internal constant POD_DEPLOYER_ROLE =
        keccak256("POD_DEPLOYER_ROLE");

    /// @notice Orca controller for Pod
    IControllerV1 public podController;

    /// @notice Orca membership token for the pods. Handles permissioning pod members
    IMemberToken private immutable memberToken;

    /// @notice Public contract that will be granted to execute all timelocks created
    address public immutable podExecutor;

    /// @notice Mapping between podId and it's optimistic timelock
    mapping(uint256 => address) public getPodTimelock;

    /// @notice Mapping between timelock and podId
    mapping(address => uint256) public getPodId;

    /// @notice Latest pod created
    uint256 public latestPodId;

    /// @notice Deployer address
    address private deployer;

    event CreatePod(uint256 indexed podId, address indexed safeAddress);
    event CreateOptimisticTimelock(address indexed timelock);
    event UpdatePodController(
        address indexed oldController,
        address indexed newController
    );

    modifier onlyTribeRolesOrDeployer() {
        ICore core = core();
        require(
            core.hasRole(GOVERN_ROLE, msg.sender) ||
                core.hasRole(POD_DEPLOYER_ROLE, msg.sender) ||
                msg.sender == deployer,
            "Unauthorised"
        );
        _;
    }

    /// @param _core Fei core address
    /// @param _podController Orca pod controller
    /// @param _memberToken Membership token that manages the Orca pod membership
    /// @param _podExecutor Public contract that will be granted to execute all timelocks created
    constructor(
        address _core,
        address _podController,
        address _memberToken,
        address _podExecutor
    ) CoreRef(_core) {
        require(_core != address(0), "Zero address");
        require(_podController != address(0x0), "Zero address");
        require(_memberToken != address(0x0), "Zero address");
        require(_podExecutor != address(0x0), "Zero address");

        podExecutor = _podExecutor;
        podController = IControllerV1(_podController);
        deployer = msg.sender;
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
    /// @param podId Unique id for the orca pod
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
    /// @param podId Unique id for the orca pod
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
    /// @param podId Unique id for the orca pod
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

    /// @notice Get the podAdmin from the base Orca controller
    /// @dev Controller only allows existing admin to change
    /// @param podId Unique id for the orca pod
    function getPodAdmin(uint256 podId)
        external
        view
        override
        returns (address)
    {
        return IControllerV1(podController).podAdmin(podId);
    }

    /// @notice Migrate to a new podController. Upgrades are opt in
    ///         and state is transitioned by the Orca controllers
    /// @dev Expects that breaking changes are not introduced by the podController
    function updatePodController(address newPodController)
        external
        override
        hasAnyOfTwoRoles(GOVERN_ROLE, POD_DEPLOYER_ROLE)
    {
        address oldController = newPodController;
        podController = IControllerV1(newPodController);
        emit UpdatePodController(oldController, newPodController);
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
    ) external override onlyTribeRolesOrDeployer returns (uint256, address) {
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
    /// @param safeAddress Address of the Gnosis Safe
    /// @param minDelay Delay on the timelock
    /// @param publicExecutor Non-permissioned smart contract that
    ///        allows any address to execute a ready transaction
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
