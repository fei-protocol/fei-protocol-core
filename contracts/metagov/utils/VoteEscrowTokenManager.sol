// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../../refs/CoreRef.sol";
import "../../core/TribeRoles.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IVeToken {
    function balanceOf(address) external view returns (uint256);

    function locked(address) external view returns (uint256);

    function create_lock(uint256 value, uint256 unlock_time) external;

    function increase_amount(uint256 value) external;

    function increase_unlock_time(uint256 unlock_time) external;

    function withdraw() external;

    function locked__end(address) external view returns (uint256);

    function checkpoint() external;

    function commit_smart_wallet_checker(address) external;

    function apply_smart_wallet_checker() external;
}

/// @title Vote-escrowed Token Manager
/// Used to permanently lock tokens in a vote-escrow contract, and refresh
/// the lock duration as needed.
/// @author Fei Protocol
abstract contract VoteEscrowTokenManager is CoreRef {
    // Events
    event Lock(uint256 cummulativeTokensLocked, uint256 lockHorizon);
    event Unlock(uint256 tokensUnlocked);

    /// @notice One week, in seconds. Vote-locking is rounded down to weeks.
    uint256 private constant WEEK = 7 * 86400; // 1 week, in seconds

    /// @notice The lock duration of veTokens
    uint256 public lockDuration;

    /// @notice The vote-escrowed token address
    IVeToken public immutable veToken;

    /// @notice The token address
    IERC20 public immutable liquidToken;

    /// @notice VoteEscrowTokenManager token Snapshot Delegator PCV Deposit constructor
    /// @param _liquidToken the token to lock for vote-escrow
    /// @param _veToken the vote-escrowed token used in governance
    /// @param _lockDuration amount of time (in seconds) tokens will  be vote-escrowed for
    constructor(
        IERC20 _liquidToken,
        IVeToken _veToken,
        uint256 _lockDuration
    ) {
        liquidToken = _liquidToken;
        veToken = _veToken;
        lockDuration = _lockDuration;
    }

    /// @notice Set the amount of time tokens will be vote-escrowed for in lock() calls
    function setLockDuration(uint256 newLockDuration) external onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        lockDuration = newLockDuration;
    }

    /// @notice Deposit tokens to get veTokens. Set lock duration to lockDuration.
    /// The only way to withdraw tokens will be to pause this contract
    /// for lockDuration and then call exitLock().
    function lock() external whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        uint256 tokenBalance = liquidToken.balanceOf(address(this));
        uint256 locked = veToken.locked(address(this));
        uint256 lockHorizon = ((block.timestamp + lockDuration) / WEEK) * WEEK;

        // First lock
        if (tokenBalance != 0 && locked == 0) {
            liquidToken.approve(address(veToken), tokenBalance);
            veToken.create_lock(tokenBalance, lockHorizon);
        }
        // Increase amount of tokens locked & refresh duration to lockDuration
        else if (tokenBalance != 0 && locked != 0) {
            liquidToken.approve(address(veToken), tokenBalance);
            veToken.increase_amount(tokenBalance);
            if (veToken.locked__end(address(this)) != lockHorizon) {
                veToken.increase_unlock_time(lockHorizon);
            }
        }
        // No additional tokens to lock, just refresh duration to lockDuration
        else if (tokenBalance == 0 && locked != 0) {
            veToken.increase_unlock_time(lockHorizon);
        }
        // If tokenBalance == 0 and locked == 0, there is nothing to do.

        emit Lock(tokenBalance + locked, lockHorizon);
    }

    /// @notice Exit the veToken lock. For this function to be called and not
    /// revert, tokens had to be locked previously, and the contract must have
    /// been paused for lockDuration in order to prevent lock extensions
    /// by calling lock(). This function will recover tokens on the contract,
    /// which can then be moved by calling withdraw() as a PCVController if the
    /// contract is also a PCVDeposit, for instance.
    function exitLock() external onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        veToken.withdraw();

        emit Unlock(liquidToken.balanceOf(address(this)));
    }

    /// @notice returns total balance of tokens, vote-escrowed or liquid.
    function _totalTokensManaged() internal view returns (uint256) {
        return liquidToken.balanceOf(address(this)) + veToken.locked(address(this));
    }
}
