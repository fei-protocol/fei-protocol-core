// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

interface IVotingEscrowDelegation is IERC721 {
    // from IERC721:
    // balanceOf, ownerOf, safeTransferFrom, transferFrom, approve, setApprovalForAll, getApproved, isApprovedForAll

    // IVotingEscrowDelegation specific:

    /// @notice Destroy a token
    /// @dev Only callable by the token owner, their operator, or an approved account.
    ///     Burning a token with a currently active boost, burns the boost.
    /// @param _token_id The token to burn
    function burn(uint256 _token_id) external;

    /// @notice Create a boost and delegate it to another account.
    /// @dev Delegated boost can become negative, and requires active management, else
    ///     the adjusted veCRV balance of the delegator's account will decrease until reaching 0
    /// @param _delegator The account to delegate boost from
    /// @param _receiver The account to receive the delegated boost
    /// @param _percentage Since veCRV is a constantly decreasing asset, we use percentage to determine
    ///     the amount of delegator's boost to delegate
    /// @param _cancel_time A point in time before _expire_time in which the delegator or their operator
    ///     can cancel the delegated boost
    /// @param _expire_time The point in time, atleast a day in the future, at which the value of the boost
    ///     will reach 0. After which the negative value is deducted from the delegator's account (and the
    ///     receiver's received boost only) until it is cancelled. This value is rounded down to the nearest
    ///     WEEK.
    /// @param _id The token id, within the range of [0, 2 ** 96). Useful for contracts given operator status
    ///     to have specific ranges.
    function create_boost(
        address _delegator,
        address _receiver,
        int256 _percentage,
        uint256 _cancel_time,
        uint256 _expire_time,
        uint256 _id
    ) external;

    /// @notice Extend the boost of an existing boost or expired boost
    /// @dev The extension can not decrease the value of the boost. If there are
    ///     any outstanding negative value boosts which cause the delegable boost
    ///     of an account to be negative this call will revert
    /// @param _token_id The token to extend the boost of
    /// @param _percentage The percentage of delegable boost to delegate
    ///     AFTER burning the token's current boost
    /// @param _expire_time The new time at which the boost value will become
    ///     0, and eventually negative. Must be greater than the previous expiry time,
    ///     and atleast a WEEK from now, and less than the veCRV lock expiry of the
    ///     delegator's account. This value is rounded down to the nearest WEEK.
    function extend_boost(
        uint256 _token_id,
        int256 _percentage,
        uint256 _expire_time,
        uint256 _cancel_time
    ) external;

    /// @notice Cancel an outstanding boost
    /// @dev This does not burn the token, only the boost it represents. The owner
    ///     of the token or their operator can cancel a boost at any time. The
    ///     delegator or their operator can only cancel a token after the cancel
    ///     time. Anyone can cancel the boost if the value of it is negative.
    /// @param _token_id The token to cancel
    function cancel_boost(uint256 _token_id) external;

    /// @notice Set or reaffirm the blacklist/whitelist status of a delegator for a receiver.
    /// @dev Setting delegator as the ZERO_ADDRESS enables users to deactive delegations globally
    ///     and enable the white list. The ability of a delegator to delegate to a receiver
    ///     is determined by ~(grey_list[_receiver][ZERO_ADDRESS] ^ grey_list[_receiver][_delegator]).
    /// @param _receiver The account which we will be updating it's list
    /// @param _delegator The account to disallow/allow delegations from
    /// @param _status Boolean of the status to set the _delegator account to
    function set_delegation_status(
        address _receiver,
        address _delegator,
        bool _status
    ) external;

    /// @notice Adjusted veCRV balance after accounting for delegations and boosts
    /// @dev If boosts/delegations have a negative value, they're effective value is 0
    /// @param _account The account to query the adjusted balance of
    function adjusted_balance_of(address _account) external view returns (uint256);

    /// @notice Query the total effective delegated boost value of an account.
    /// @dev This value can be greater than the veCRV balance of
    ///     an account if the account has outstanding negative
    ///     value boosts.
    /// @param _account The account to query
    function delegated_boost(address _account) external view returns (uint256);

    /// @notice Query the total effective received boost value of an account
    /// @dev This value can be 0, even with delegations which have a large value,
    ///     if the account has any outstanding negative value boosts.
    /// @param _account The account to query
    function received_boost(address _account) external view returns (uint256);

    /// @notice Query the effective value of a boost
    /// @dev The effective value of a boost is negative after it's expiration
    ///     date.
    /// @param _token_id The token id to query
    function token_boost(uint256 _token_id) external view returns (int256);

    /// @notice Query the timestamp of a boost token's expiry
    /// @dev The effective value of a boost is negative after it's expiration
    ///     date.
    /// @param _token_id The token id to query
    function token_expiry(uint256 _token_id) external view returns (uint256);

    /// @notice Query the timestamp of a boost token's cancel time. This is
    ///     the point at which the delegator can nullify the boost. A receiver
    ///     can cancel a token at any point. Anyone can nullify a token's boost
    ///     after it's expiration.
    /// @param _token_id The token id to query
    function token_cancel_time(uint256 _token_id) external view returns (uint256);
}
