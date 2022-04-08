// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {ControllerV1} from "@orcaprotocol/contracts/contracts/ControllerV1.sol";
import {MemberToken} from "@orcaprotocol/contracts/contracts/MemberToken.sol";
import {IGnosisSafe} from "./interfaces//IGnosisSafe.sol";
import {IPodFactory} from "./interfaces/IPodFactory.sol";

import {TribeRoles} from "../core/TribeRoles.sol";
import {OptimisticTimelock} from "../dao/timelock/OptimisticTimelock.sol";
import {CoreRef} from "../refs/CoreRef.sol";
import {ICore} from "../core/ICore.sol";
import {IPodAdminGateway} from "./interfaces/IPodAdminGateway.sol";

/// @dev This contract is primarily a factory contract which an admin
/// can use to deploy more optimistic governance pods. It will create an
/// Orca pod and deploy an optimistic timelock alongside it.
///
/// The timelock and Orca pod are then linked up so that the Orca pod is
/// the only proposer and executor.
contract PodFactory is CoreRef, IPodFactory {
    /// @notice Orca controller for Pod
    ControllerV1 public override podController;

    /// @notice Orca membership token for the pods. Handles permissioning pod members
    MemberToken private immutable memberToken;

    /// @notice Public contract that will be granted to execute all timelocks created
    address public immutable podExecutor;

    /// @notice Mapping between podId and it's optimistic timelock
    mapping(uint256 => address) public override getPodTimelock;

    /// @notice Mapping between timelock and podId
    mapping(address => uint256) public getPodId;

    /// @notice Latest pod created
    uint256 public latestPodId;

    /// @notice Burner function used flag
    bool public burnerDeploymentUsed = false;

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
        podExecutor = _podExecutor;
        podController = ControllerV1(_podController);
        memberToken = MemberToken(_memberToken);

        // TODO: Deploy initial pod in the constructor here. Remove burner method
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

    //////////////////// STATE-CHANGING API ////////////////////

    /// @notice Create a child Orca pod with optimistic timelock. Callable by the DAO and the Tribal Council
    ///         Returns podId, optimistic pod timelock address and the Pod Gnosis Safe address
    ///         This will lock membership transfers by default
    function createChildOptimisticPod(PodConfig calldata _config)
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
        (
            uint256 podId,
            address timelock,
            address safe
        ) = _createChildOptimisticPod(_config);

        // Disable membership transfers by default
        IPodAdminGateway(_config.admin).lockMembershipTransfers(podId);
        return (podId, timelock, safe);
    }


    /// @notice One time use at deploy time function to create childOptimisticTimelocks
    function burnerCreateChildOptimisticPods(PodConfig[] calldata _config)
        external
        override
        returns (
            uint256[] memory,
            address[] memory,
            address[] memory
        )
    {
        require(
            burnerDeploymentUsed == false,
            "Burner deployment already used"
        );

        uint256[] memory podIds = new uint256[](_config.length);
        address[] memory timelocks = new address[](_config.length);
        address[] memory safes = new address[](_config.length);

        {
            for (uint256 i = 0; i < _config.length; i += 1) {
                (
                    uint256 podId,
                    address timelock,
                    address safe
                ) = _createChildOptimisticPod(_config[i]);
                podIds[i] = podId;
                timelocks[i] = timelock;
                safes[i] = safe;
            }
        }
        burnerDeploymentUsed = true;
        return (podIds, timelocks, safes);
    }

    ////////////////////////     INTERNAL          ////////////////////////////

    /// @notice Internal method to create a child optimistic pod
    /// @param _config Pod configuraton
    function _createChildOptimisticPod(PodConfig calldata _config)
        internal
        returns (
            uint256,
            address,
            address
        )
    {
        uint256 podId = memberToken.getNextAvailablePodId();

        address safeAddress = createPod(
            _config.members,
            _config.threshold,
            _config.label,
            _config.ensString,
            _config.imageUrl,
            _config.admin,
            podId
        );

        address timelock;
        // TODO: Add option to avoid setting a timelock
        if (minDelay != 0) {
            // TODO: Enforce min delay if defined
            require(minDelay >= 1 days) {
                timelock = createOptimisticTimelock(
                safeAddress,
                _config.minDelay,
                podExecutor,
                _config.admin
            );
            // Set mapping from podId to timelock for reference
            getPodTimelock[podId] = timelock;
            getPodId[timelock] = podId;
            latestPodId = podId;
            }
            
        }
        emit CreatePod(podId, safeAddress);
        return (podId, timelock, safeAddress);
    }

    /// @notice Create an Orca pod - a Gnosis Safe with a membership wrapper
    // TODO: Prefix with _ to signal internal
    function _createPod(
        address[] calldata _members,
        uint256 _threshold,
        bytes32 _label,
        string calldata _ensString,
        string calldata _imageUrl,
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

    /// @notice Create an optimistic timelock, linking to an Orca pod
    /// @param safeAddress Address of the Gnosis Safe
    /// @param minDelay Delay on the timelock
    /// @param publicExecutor Non-permissioned smart contract that
    ///        allows any address to execute a ready transaction
    /// @param vetoController Address which manages veto rights over a pod timelock
    ///        Will also be able to propose
    // TODO: Prefix with _
    function createOptimisticTimelock(
        address safeAddress,
        uint256 minDelay,
        address publicExecutor,
        address podAdmin
    ) internal returns (address) {
        // TODO: Validate minDelay
        address[] memory proposers = new address[](2);  // cancel timelock
        proposers[0] = safeAddress;
        // Note: If you migrate the podAdmin, then it will not have the timelock propsoer role. So it
        // will not be able to cancel the timelock.
        // TODO: Remove podAdminGateway
        proposers[1] = podAdmin;

        address[] memory executors = new address[](2);
        executors[0] = safeAddress;
        executors[1] = publicExecutor;

        // TODODODODODO: Use TimelockController from OZ
        OptimisticTimelock timelock = new TimelockController(
            address(core()),
            minDelay,
            proposers,
            executors
        );
        emit CreateOptimisticTimelock(address(timelock));
        return address(timelock);
    }


    // TODO: Way to make Orca pod without timelock
}
