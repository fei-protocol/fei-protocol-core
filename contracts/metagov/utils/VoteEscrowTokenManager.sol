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
}

/// @title Vote-escrowed Token Manager
/// Used to permanently lock tokens in a vote-escrow contract, and refresh
/// the lock duration as needed.
/// @author Fei Protocol
abstract contract VoteEscrowTokenManager is CoreRef {

    /// @notice The maximum lock duration of veTokens
    uint256 private immutable MAXTIME;

    /// @notice The vote-escrowed token address
    IVeToken public immutable veToken;

    /// @notice The token address
    IERC20 public immutable liquidToken;

    /// @notice VoteEscrowTokenManager token Snapshot Delegator PCV Deposit constructor
    /// @param _liquidToken the token to lock for vote-escrow
    /// @param _veToken the vote-escrowed token used in governance
    /// @param _maxTime maximum time tokens can be vote-escrowed for
    constructor(
        IERC20 _liquidToken,
        IVeToken _veToken,
        uint256 _maxTime
    ) {
        liquidToken = _liquidToken;
        veToken = _veToken;
        MAXTIME = _maxTime;
    }

    /// @notice Deposit tokens to get veTokens. Set lock duration to MAXTIME.
    /// The only way to withdraw tokens will be to pause this contract
    /// for MAXTIME and then call exitLock().
    function lock() external whenNotPaused onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        uint256 tokenBalance = liquidToken.balanceOf(address(this));
        uint256 locked = veToken.locked(address(this));
        uint256 lockHorizon = block.timestamp + MAXTIME;

        // First lock
        if (tokenBalance != 0 && locked == 0) {
            liquidToken.approve(address(veToken), tokenBalance);
            veToken.create_lock(tokenBalance, lockHorizon);
        }
        // Increase amount of tokens locked & refresh duration to MAXTIME
        else if (tokenBalance != 0 && locked != 0) {
            liquidToken.approve(address(veToken), tokenBalance);
            veToken.increase_amount(tokenBalance);
            veToken.increase_unlock_time(lockHorizon);
        }
        // No additional tokens to lock, just refresh duration to MAXTIME
        else if (tokenBalance == 0 && locked != 0) {
            veToken.increase_unlock_time(lockHorizon);
        }
        // If tokenBalance == 0 and locked == 0, there is nothing to do.
    }

    /// @notice Exit the veToken lock. For this function to be called and not
    /// revert, tokens had to be locked previously, and the contract must have
    /// been paused for MAXTIME in order to prevent lock extensions
    /// by calling lock(). This function will recover tokens on the contract,
    /// which can then be moved by calling withdraw() as a PCVController if the
    /// contract is also a PCVDeposit, for instance.
    function exitLock() external onlyTribeRole(TribeRoles.METAGOVERNANCE_TOKEN_STAKING) {
        veToken.withdraw();
    }

    /// @notice returns total balance of tokens, vote-escrowed or liquid.
    function _totalTokens() internal view returns (uint256) {
        return liquidToken.balanceOf(address(this)) + veToken.locked(address(this));
    }
}
