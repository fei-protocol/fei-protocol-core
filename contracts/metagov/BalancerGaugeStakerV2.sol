// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {BalancerGaugeStaker} from "./BalancerGaugeStaker.sol";
import {IVotingEscrowDelegation} from "./IVotingEscrowDelegation.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title Vote-escrowed boost Manager for Balancer
/// Used to manage delegation of vote-escrow boost as in Curve Protocol.
/// @author eswak
contract BalancerGaugeStakerV2 is BalancerGaugeStaker, Ownable {
    // events
    event VotingEscrowDelegationChanged(address indexed oldAddress, address indexed newAddress);

    /// @notice Balancer gauge staker
    /// @param _core Fei Core for reference
    constructor(
        address _core,
        address _gaugeController,
        address _balancerMinter
    ) BalancerGaugeStaker(_core, _gaugeController, _balancerMinter) {}

    /// @notice The token address
    address public votingEscrowDelegation;

    /// @notice to initialize state variables in the proxy
    function _initialize(address _owner, address _votingEscrowDelegation) external {
        address currentOwner = owner();
        require(currentOwner == address(0) || msg.sender == currentOwner, "ALREADY_INITIALIZED");
        if (currentOwner != _owner) _transferOwnership(_owner);
        votingEscrowDelegation = _votingEscrowDelegation;
    }

    /// @notice Set the contract used to manage boost delegation
    /// @dev the call is gated to the same role as the role to manage veTokens
    function setVotingEscrowDelegation(address newVotingEscrowDelegation) public onlyOwner {
        emit VotingEscrowDelegationChanged(votingEscrowDelegation, newVotingEscrowDelegation);
        votingEscrowDelegation = newVotingEscrowDelegation;
    }

    /// @notice Create a boost and delegate it to another account.
    function create_boost(
        address _delegator,
        address _receiver,
        int256 _percentage,
        uint256 _cancel_time,
        uint256 _expire_time,
        uint256 _id
    ) external onlyOwner {
        IVotingEscrowDelegation(votingEscrowDelegation).create_boost(
            _delegator,
            _receiver,
            _percentage,
            _cancel_time,
            _expire_time,
            _id
        );
    }

    /// @notice Extend the boost of an existing boost or expired boost
    function extend_boost(
        uint256 _token_id,
        int256 _percentage,
        uint256 _expire_time,
        uint256 _cancel_time
    ) external onlyOwner {
        IVotingEscrowDelegation(votingEscrowDelegation).extend_boost(
            _token_id,
            _percentage,
            _expire_time,
            _cancel_time
        );
    }

    /// @notice Cancel an outstanding boost
    function cancel_boost(uint256 _token_id) external onlyOwner {
        IVotingEscrowDelegation(votingEscrowDelegation).cancel_boost(_token_id);
    }

    /// @notice Destroy a token
    function burn(uint256 _token_id) external onlyOwner {
        IVotingEscrowDelegation(votingEscrowDelegation).burn(_token_id);
    }
}
