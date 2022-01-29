// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./ERC20TokemakPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ITokemakOnChainVoteL1 {
    struct UserVotePayload {
        address account;
        bytes32 voteSessionKey;
        uint256 nonce;
        uint256 chainId;
        uint256 totalVotes;
        UserVoteAllocationItem[] allocations;
    }

    struct UserVoteAllocationItem {
        bytes32 reactorKey; //asset-default, in actual deployment could be asset-exchange
        uint256 amount; //18 Decimals
    }

    function vote(UserVotePayload memory userVotePayload) external;
}

/// @title TOKE implementation for a Tokemak ERC20 PCV Deposit
/// that allows to use tTOKE to vote for FEI reactor.
/// @author Fei Protocol
contract TokeTokemakPCVDeposit is ERC20TokemakPCVDeposit {

    /// @notice the bridge to forward votes from L1 to Polygon
    address public voteBridge;
    /// @notice the reactor keys for which to vote
    bytes32[] public reactorKeys;
    /// @notice the reactor allocations to use during votes, in basis points (10_000).
    uint256[] public allocationBasisPoints;

    /// @notice Tokemak ERC20 PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pool Tokemak pool to deposit in
    /// @param _rewards Tokemak rewards contract
    constructor(
        address _core,
        address _pool,
        address _rewards
    ) ERC20TokemakPCVDeposit(_core, _pool, _rewards) {
        require(address(token) == address(0x2e9d63788249371f1DFC918a52f8d799F4a38C94), "TokeTokemakPCVDeposit: must use TOKE token");
        voteBridge = address(0x16031783D3D27Ce25EBcfB341F4EeC8F7Ba915bE);

        _setContractAdminRole(keccak256("METAGOV_ADMIN_ROLE"));
    }

    /// @notice Set the vote bridge to relay L1 vote to Polygon
    /// @param newVoteBridge the address of the bridge to use for future votes.
    function setVoteBridge(address newVoteBridge) onlyGovernorOrAdmin external {
        require(newVoteBridge != address(0), "TokeTokemakPCVDeposit: invalid address");
        voteBridge = newVoteBridge;
    }

    /// @notice Set the reactor keys and allocations in basis points to use in the
    /// next votes. This function is permissioned, but voting is permissionless.
    /// @param newReactorKeys reactor keys to vote for (e.g. keccak256("fei-default"))
    /// @param newAllocationBasisPoints allocations for each of the reactor keys
    /// in basis points. Sum of the array must be 10_000.
    function setReactorKeysAndAllocations(bytes32[] memory newReactorKeys, uint256[] memory newAllocationBasisPoints) onlyGovernorOrAdmin external {
        // Check new allocations
        require(newReactorKeys.length == newAllocationBasisPoints.length, "TokeTokemakPCVDeposit: wrong array sizes");
        require(newReactorKeys.length > 0, "TokeTokemakPCVDeposit: empty arrays");
        uint256 sum = 0;
        for (uint256 i = 0; i < newAllocationBasisPoints.length; i++) {
            sum += newAllocationBasisPoints[i];
        }
        require(sum == 10000, "TokeTokemakPCVDeposit: allocations must sum to 10000");

        // Save new allocations in state
        reactorKeys = newReactorKeys;
        allocationBasisPoints = newAllocationBasisPoints;
    }

    /// @notice Vote for tokemak reactors using the pre-defined vote allocations.
    /// For details on how to fill parameters, see https://tokemak.notion.site/Voting-Integration-a56468fb721f4330988af90848ae4783
    /// @param voteSessionKey the currently active voting session id
    /// @param nonce the nonce of voting for this contract address
    function vote(bytes32 voteSessionKey, uint256 nonce) whenNotPaused external {
        ITokemakOnChainVoteL1.UserVotePayload memory userVotePayload;
        userVotePayload.account = address(this);
        userVotePayload.voteSessionKey = voteSessionKey;
        userVotePayload.nonce = nonce;
        userVotePayload.chainId = 137;
        userVotePayload.totalVotes = balance();

        ITokemakOnChainVoteL1.UserVoteAllocationItem[] memory allocations = new ITokemakOnChainVoteL1.UserVoteAllocationItem[](reactorKeys.length);
        for (uint256 i = 0; i < reactorKeys.length; i++) {
            ITokemakOnChainVoteL1.UserVoteAllocationItem memory allocation;
            allocation.reactorKey = reactorKeys[i];
            allocation.amount = userVotePayload.totalVotes * allocationBasisPoints[i] / 10000;
            allocations[i] = allocation;
        }
        userVotePayload.allocations = allocations;

        ITokemakOnChainVoteL1(voteBridge).vote(userVotePayload);
    }
}
