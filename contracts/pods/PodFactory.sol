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

/// @dev This contract is primarily a factory contract which an admin
/// can use to deploy more optimistic governance pods. It will create an
/// Orca pod and deploy a timelock alongside it.
///
/// The timelock and Orca pod are then linked up so that the Orca pod is
/// the only proposer and executor.
contract PodFactory is CoreRef, IPodFactory {
    /// @notice Orca controller for Pod
    ControllerV1 public immutable override podController;

    /// @notice Orca membership token for the pods. Handles permissioning pod members
    MemberToken public immutable memberToken;

    /// @notice Public contract that will be granted to execute all timelocks created
    address public immutable podExecutor;

    /// @notice Pod admin gateway, through which admin functionality on pods is accessed
    PodAdminGateway public immutable podAdminGateway;

    /// @notice Mapping between podId and it's timelock
    mapping(uint256 => address) public override getPodTimelock;

    /// @notice Mapping between timelock and podId
    mapping(address => uint256) public getPodId;

    /// @notice Latest pod created
    uint256 public latestPodId;

    /// @notice Track whether the one time use initial pod deploy has been used
    bool public genesisDeployed;

    /// @notice Minimum delay of a pod timelock, if one is to be created with one
    uint256 public constant MIN_TIMELOCK_DELAY = 1 days;

    /// @param _core Fei core address
    /// @param _podController Orca pod controller
    /// @param _memberToken Membership token that manages the Orca pod membership
    /// @param _podExecutor Public contract that will be granted to execute all timelocks created
    /// @param _podAdminGateway Pod admin gateway, through which admin functionality on pods is accessed
    constructor(
        address _core,
        address _podController,
        address _memberToken,
        address _podExecutor,
        address _podAdminGateway
    ) CoreRef(_core) {
        podExecutor = _podExecutor;
        podController = ControllerV1(_podController);
        memberToken = MemberToken(_memberToken);
        podAdminGateway = PodAdminGateway(_podAdminGateway);
    }

    ///////////////////// GETTERS ///////////////////////

    /// @notice Get the member token
    function getMemberToken() external view override returns (MemberToken) {
        return memberToken;
    }

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
        return podController.podAdmin(podId);
    }

    /// @notice Get whether membership transfers are enabled for a pod
    function getIsMembershipTransferLocked(uint256 podId)
        external
        view
        override
        returns (bool)
    {
        return podController.isTransferLocked(podId);
    }

    /// @notice Deploy the genesis pod, one time use method
    function deployGenesisPod(PodConfig calldata _config)
        external
        override
        returns (
            uint256,
            address,
            address
        )
    {
        require(!genesisDeployed, "Genesis pod already deployed");
        genesisDeployed = true;
        return _createOptimisticPod(_config);
    }

    //////////////////// STATE-CHANGING API ////////////////////
    /// @notice Create a child Orca pod with timelock. Callable by the DAO and the Tribal Council
    ///         Returns podId, pod timelock address and the Pod Gnosis Safe address
    ///         This will lock membership transfers by default
    function createOptimisticPod(PodConfig calldata _config)
        public
        override
        // TODO: POD_ADMIN rather than POD_DEPLOYER_ROLE
        hasAnyOfTwoRoles(TribeRoles.GOVERNOR, TribeRoles.POD_DEPLOYER_ROLE)
        returns (
            uint256,
            address,
            address
        )
    {
        (uint256 podId, address timelock, address safe) = _createOptimisticPod(
            _config
        );

        // Disable membership transfers by default
        podAdminGateway.lockMembershipTransfers(podId);
        return (podId, timelock, safe);
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
            address(podAdminGateway),
            podId
        );

        address timelock;
        // TODO: Add option to avoid setting a timelock
        if (_config.minDelay != 0) {
            // TODO: Enforce min delay if defined
            require(
                _config.minDelay >= MIN_TIMELOCK_DELAY,
                "Min delay too small"
            );
            timelock = address(
                _createTimelock(
                    safeAddress,
                    _config.minDelay,
                    podExecutor,
                    address(podAdminGateway)
                )
            );
        } else {
            timelock = address(0);
        }

        // Set mapping from podId to timelock for reference
        getPodTimelock[podId] = timelock;
        getPodId[timelock] = podId;
        latestPodId = podId;
        emit CreatePod(podId, safeAddress);
        return (podId, timelock, safeAddress);
    }

    /// @notice Create an Orca pod - a Gnosis Safe with a membership wrapper
    // TODO: Prefix with _ to signal internal
    function _createPod(
        address[] memory _members,
        uint256 _threshold,
        bytes32 _label,
        string memory _ensString,
        string memory _imageUrl,
        address _admin,
        uint256 podId
    ) internal returns (address) {
        podController.createPod(
            _members,
            _threshold,
            _admin,
            _label,
            _ensString,
            podId,
            _imageUrl
        );
        return podController.podIdToSafe(podId);
    }

    /// @notice Create a timelock, linking to an Orca pod
    /// @param safeAddress Address of the Gnosis Safe
    /// @param minDelay Delay on the timelock
    /// @param publicExecutor Non-permissioned smart contract that
    ///        allows any address to execute a ready transaction
    /// @param podAdmin Address which is the admin of the Orca pods
    ///        Will also be able to propose
    // TODO: Prefix with _
    function _createTimelock(
        address safeAddress,
        uint256 minDelay,
        address publicExecutor,
        address podAdmin
    ) internal returns (address) {
        // TODO: Validate minDelay
        address[] memory proposers = new address[](2); // cancel timelock
        proposers[0] = safeAddress;
        // Note: If you migrate the podAdmin, then it will not have the timelock propsoer role. So it
        // will not be able to cancel the timelock.
        // TODO: Remove podAdminGateway
        proposers[1] = podAdmin;

        address[] memory executors = new address[](2);
        executors[0] = safeAddress;
        executors[1] = publicExecutor;

        TimelockController timelock = new TimelockController(
            minDelay,
            proposers,
            executors
        );
        emit CreateTimelock(address(timelock));
        return address(timelock);
    }

    // TODO: Way to make Orca pod without timelock
}
