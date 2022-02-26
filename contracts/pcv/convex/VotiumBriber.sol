// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IVotiumBribe.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title VotiumBriber: implementation for a contract that can use
/// tokens to bribe on Votium.
/// @author Fei Protocol
contract VotiumBriber is CoreRef {
    using SafeERC20 for IERC20;

    // ------------------ Properties -------------------------------------------

    /// @notice The Curve pool to deposit in
    IVotiumBribe public votiumBribe;

    /// @notice The token to spend bribes in
    IERC20 public token;

    // ------------------ Constructor ------------------------------------------

    /// @notice VotiumBriber constructor
    /// @param _core Fei Core for reference
    /// @param _token The token spent for bribes
    /// @param _votiumBribe The Votium bribe contract
    constructor(
        address _core,
        IERC20 _token,
        IVotiumBribe _votiumBribe
    ) CoreRef(_core) {
        token = _token;
        votiumBribe = _votiumBribe;

        _setContractAdminRole(keccak256("TRIBAL_CHIEF_ADMIN_ROLE"));
    }

    /// @notice Spend tokens on Votium to bribe for a given pool.
    /// @param _proposal id of the proposal on snapshot
    /// @param _choiceIndex index of the pool in the snapshot vote to vote for
    /// @dev the call will revert if Votium has not called initiateProposal with
    /// the _proposal ID, if _choiceIndex is out of range, or of block.timestamp
    /// is after the deadline for bribing (usually 6 hours before Convex snapshot
    /// vote ends).
    function bribe(bytes32 _proposal, uint256 _choiceIndex)
        public
        onlyGovernorOrAdmin
        whenNotPaused
    {
        // fetch the current number of TRIBE
        uint256 tokenAmount = token.balanceOf(address(this));
        require(tokenAmount > 0, "VotiumBriber: no tokens to bribe");

        // send TRIBE to bribe contract
        token.approve(address(votiumBribe), tokenAmount);
        votiumBribe.depositBribe(
            address(token), // token
            tokenAmount, // amount
            _proposal, // proposal
            _choiceIndex // choiceIndex
        );
    }

    /// @notice withdraw ERC20 from the contract
    /// @param token address of the ERC20 to send
    /// @param to address destination of the ERC20
    /// @param amount quantity of ERC20 to send
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyPCVController {
        IERC20(token).safeTransfer(to, amount);
    }
}
