// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {TimelockController} from "@openzeppelin/contracts/governance/TimelockController.sol";
import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";
import {IGnosisSafe} from "./interfaces//IGnosisSafe.sol";
import {IPodFactory} from "./interfaces/IPodFactory.sol";

import {TribeRoles} from "../core/TribeRoles.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";
import {PodAdminGateway} from "./PodAdminGateway.sol";
import {PodExecutor} from "./PodExecutor.sol";

/// @title PodFactory for TRIBE Governance pods
/// @notice A factory to create optimistic pods used in the Tribe Governance system
/// @dev This contract is primarily a factory contract which can be used to deploy
/// more optimistic governance pods. It will create an Orca pod and if specified,
/// deploy a timelock alongside it. The timelock and Orca pod are linked.
contract PodFactory is CoreRef, IPodFactory {
    /// @notice Orca membership token for the pods. Handles permissioning pod members
    MemberToken public immutable memberToken;

    /// @notice Public contract that has EXECUTOR_ROLE on all pod timelocks, to allow permissionless execution
    PodExecutor public immutable podExecutor;

    /// @notice Default podController used to create pods
    ControllerV1 public override defaultPodController;

    /// @notice Mapping between podId and it's timelock
    mapping(uint256 => address) public override getPodTimelock;

    /// @notice Mapping between timelock and podId
    mapping(address => uint256) public getPodId;

    /// @notice Created pod safe addresses
    address[] private podSafeAddresses;

    /// @notice Track whether the one time use Council pod was used
    bool public tribalCouncilDeployed;

    /// @notice Minimum delay of a pod timelock, if one is to be created with one
    uint256 public constant MIN_TIMELOCK_DELAY = 1 days;

    /// @param _core Fei core address
    /// @param _memberToken Membership token that manages the Orca pod membership
    /// @param _defaultPodController Default pod controller that will be used to create pods initially
    /// @param _podExecutor Public contract that will be granted the role to execute transactions on all timelocks
    constructor(
        address _core,
        address _memberToken,
        address _defaultPodController,
        address _podExecutor
    ) CoreRef(_core) {
        podExecutor = PodExecutor(_podExecutor);
        defaultPodController = ControllerV1(_defaultPodController);
        memberToken = MemberToken(_memberToken);
    }

    ///////////////////// GETTERS ///////////////////////

    /// @notice Get the number of pods this factory has created
    function getNumberOfPods() external view override returns (uint256) {
        return podSafeAddresses.length;
    }

    /// @notice Get the safe addresses of all pods created by this factory
    function getPodSafeAddresses() external view override returns (address[] memory) {
        return podSafeAddresses;
    }

    /// @notice Get the member token
    function getMemberToken() external view override returns (MemberToken) {
        return memberToken;
    }

    /// @notice Get the pod controller for a podId
    function getPodController(uint256 podId) external view override returns (ControllerV1) {
        return ControllerV1(memberToken.memberController(podId));
    }

    /// @notice Get the address of the Gnosis safe that represents a pod
    /// @param podId Unique id for the orca pod
    function getPodSafe(uint256 podId) public view override returns (address) {
        ControllerV1 podController = ControllerV1(memberToken.memberController(podId));
        return podController.podIdToSafe(podId);
    }

    /// @notice Get the number of pod members
    /// @param podId Unique id for the orca pod
    function getNumMembers(uint256 podId) external view override returns (uint256) {
        address safe = getPodSafe(podId);
        address[] memory members = IGnosisSafe(safe).getOwners();
        return uint256(members.length);
    }

    /// @notice Get all members on the pod
    /// @param podId Unique id for the orca pod
    function getPodMembers(uint256 podId) public view override returns (address[] memory) {
        ControllerV1 podController = ControllerV1(memberToken.memberController(podId));
        address safeAddress = podController.podIdToSafe(podId);
        return IGnosisSafe(safeAddress).getOwners();
    }

    /// @notice Get the signer threshold on the pod
    /// @param podId Unique id for the orca pod
    function getPodThreshold(uint256 podId) external view override returns (uint256) {
        address safe = getPodSafe(podId);
        uint256 threshold = uint256(IGnosisSafe(safe).getThreshold());
        return threshold;
    }

    /// @notice Get the next pod id
    function getNextPodId() external view override returns (uint256) {
        return memberToken.getNextAvailablePodId();
    }

    /// @notice Get the podAdmin from the pod controller
    /// @param podId Unique id for the orca pod
    function getPodAdmin(uint256 podId) external view override returns (address) {
        ControllerV1 podController = ControllerV1(memberToken.memberController(podId));
        return podController.podAdmin(podId);
    }

    /// @notice Get whether membership transfers are enabled for a pod
    function getIsMembershipTransferLocked(uint256 podId) external view override returns (bool) {
        ControllerV1 podController = ControllerV1(memberToken.memberController(podId));
        return podController.isTransferLocked(podId);
    }

    //////////////////// STATE-CHANGING API ////////////////////

    /// @notice Deploy the genesis pod, one time use method. It will not lock membership transfers, has to be done
    ///         in a seperate call to the PodAdminGateway
    function deployCouncilPod(PodConfig calldata _config)
        external
        override
        returns (
            uint256,
            address,
            address
        )
    {
        require(!tribalCouncilDeployed, "Genesis pod already deployed");
        tribalCouncilDeployed = true;
        return _createOptimisticPod(_config);
    }

    /// @notice Create an Orca pod with timelock. Callable by the DAO and the Tribal Council
    ///         Returns podId, pod timelock address and the Pod Gnosis Safe address
    ///         This will lock membership transfers by default
    function createOptimisticPod(PodConfig calldata _config)
        public
        override
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN)
        returns (
            uint256,
            address,
            address
        )
    {
        (uint256 podId, address timelock, address safe) = _createOptimisticPod(_config);

        // Disable membership transfers by default
        PodAdminGateway(_config.admin).lockMembershipTransfers(podId);
        return (podId, timelock, safe);
    }

    /// @notice Update the default pod controller
    function updateDefaultPodController(address _newDefaultController)
        external
        override
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.POD_ADMIN)
    {
        emit UpdateDefaultPodController(address(defaultPodController), _newDefaultController);
        defaultPodController = ControllerV1(_newDefaultController);
    }

    ////////////////////////     INTERNAL          ////////////////////////////

    /// @notice Internal method to create a child optimistic pod
    /// @param _config Pod configuraton
    function _createOptimisticPod(PodConfig calldata _config)
        internal
        returns (
            uint256,
            address,
            address
        )
    {
        uint256 podId = memberToken.getNextAvailablePodId();

        address safeAddress = _createPod(
            _config.members,
            _config.threshold,
            _config.label,
            _config.ensString,
            _config.imageUrl,
            _config.admin,
            podId
        );

        // Timelock will by default be address(0) if no `minDelay` is provided
        address timelock;
        if (_config.minDelay != 0) {
            require(_config.minDelay >= MIN_TIMELOCK_DELAY, "Min delay too small");
            timelock = address(_createTimelock(safeAddress, _config.minDelay, address(podExecutor), _config.admin));
            // Set mapping from podId to timelock for reference
            getPodTimelock[podId] = timelock;
            getPodId[timelock] = podId;
        }

        podSafeAddresses.push(safeAddress);
        emit CreatePod(podId, safeAddress, timelock);
        return (podId, timelock, safeAddress);
    }

    /// @notice Create an Orca pod - a Gnosis Safe with a membership wrapper
    function _createPod(
        address[] calldata _members,
        uint256 _threshold,
        bytes32 _label,
        string calldata _ensString,
        string calldata _imageUrl,
        address _admin,
        uint256 podId
    ) internal returns (address) {
        defaultPodController.createPod(_members, _threshold, _admin, _label, _ensString, podId, _imageUrl);
        return defaultPodController.podIdToSafe(podId);
    }

    /// @notice Create a timelock, linking to an Orca pod
    /// @param safeAddress Address of the Gnosis Safe
    /// @param minDelay Delay on the timelock
    /// @param publicExecutor Non-permissioned smart contract that
    ///        allows any address to execute a ready transaction
    /// @param podAdmin Address which is the admin of the Orca pods
    /// @dev Roles that individual addresses are granted on the relevant timelock:
    //         safeAddress - PROPOSER_ROLE, CANCELLER_ROLE, EXECUTOR_ROLE
    //         podAdmin - CANCELLER_ROLE
    //         publicExecutor - EXECUTOR_ROLE
    function _createTimelock(
        address safeAddress,
        uint256 minDelay,
        address publicExecutor,
        address podAdmin
    ) internal returns (address) {
        address[] memory proposers = new address[](2);
        proposers[0] = safeAddress;
        proposers[1] = podAdmin;

        address[] memory executors = new address[](2);
        executors[0] = safeAddress;
        executors[1] = publicExecutor;

        TimelockController timelock = new TimelockController(minDelay, proposers, executors);

        // Revoke PROPOSER_ROLE priviledges from podAdmin. Only pod Safe can propose
        timelock.revokeRole(timelock.PROPOSER_ROLE(), podAdmin);

        // Revoke TIMELOCK_ADMIN_ROLE priviledges from deployer factory
        timelock.revokeRole(timelock.TIMELOCK_ADMIN_ROLE(), address(this));

        emit CreateTimelock(address(timelock));
        return address(timelock);
    }
}
