pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title A fluid pool for earning a reward token with staked tokens
/// @author Fei Protocol
interface IPool {

    // State changing API

    /// @notice collect redeemable rewards without unstaking
    /// @param account the account to claim for
    /// @return the amount of reward claimed
    /// @dev redeeming on behalf of another account requires ERC-20 approval of the pool tokens
    function claim(address account) external returns(uint);
    
    /// @notice deposit staked tokens
    /// @param amount the amount of staked to deposit
    /// @dev requires ERC-20 approval of stakedToken for the Pool contract
    function deposit(uint amount) external;

    /// @notice claim all rewards and withdraw stakedToken
    /// @return amountStaked the amount of stakedToken withdrawn
    /// @return amountReward the amount of rewardToken received
    function withdraw() external returns(uint amountStaked, uint amountReward);
    
    /// @notice initializes the pool start time. Only callable once
    function init() external;

    // Reward Getters

    /// @notice the ERC20 reward token
    /// @return the IERC20 implementation address
    function rewardToken() external view returns(IERC20);

    /// @notice the total amount of rewards distributed by the contract over entire period
    /// @return the total, including currently held and previously claimed rewards
    function totalReward() external view returns (uint);
    
    /// @notice the amount of rewards currently redeemable by an account
    /// @param account the potentially redeeming account
    /// @return reward amount
    function redeemableReward(address account) external view returns(uint);
 
    /// @notice the total amount of rewards owned by contract and unlocked for release
    /// @return the total
    function releasedReward() external view returns (uint);
    
    /// @notice the total amount of rewards owned by contract and locked
    /// @return the total
    function unreleasedReward() external view returns (uint);

    /// @notice the total balance of rewards owned by contract, locked or unlocked
    /// @return the total
    function rewardBalance() external view returns (uint);

    /// @notice the total amount of rewards previously claimed
    /// @return the total
    function claimedRewards() external view returns(uint128);

    // Staked Getters

    /// @notice the ERC20 staked token
    /// @return the IERC20 implementation address
    function stakedToken() external view returns(IERC20);

    /// @notice the total amount of staked tokens in the contract
    /// @return the total
    function totalStaked() external view returns(uint128);

    /// @notice the staked balance of a given account
    /// @param account the user account
    /// @return the total staked
    function stakedBalance(address account) external view returns(uint);

    // Time Getters

    /// @notice the block timestamp when the pool was initialized
    /// @return the timestamp
    function startTime() external view returns(uint32);

    /// @notice total duration in seconds of the reward release
    /// @return duration
    function duration() external view returns(uint32);

    /// @notice number of seconds remaining until all rewards are unlocked
    /// @return remaining
    function remainingTime() external view returns(uint32);
    
    /// @notice number of seconds since contract was initialized
    /// @return timestamp
    /// @dev will be less than or equal to duration
    function timestamp() external view returns(uint32);
}
