// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IRewarder.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @title FEI stablecoin interface
/// @author Fei Protocol
interface ITribalChief {
    /// @notice Data needed for governor to create a new lockup period
    /// and associated reward multiplier
    struct RewardData {
        uint128 lockLength;
        uint128 rewardMultiplier;
    }

    /// @notice Info of each pool.
    struct PoolInfo {
        uint256 virtualTotalSupply;
        uint256 accTribePerShare;
        uint128 lastRewardBlock;
        uint120 allocPoint;
        bool unlocked;
    }

    function rewardMultipliers(uint256 _pid, uint128 _blocksLocked) external view returns (uint128);
    function stakedToken(uint256 _index) external view returns(IERC20);
    function poolInfo(uint256 _index) external view returns(IERC20);
    function deposit(uint256 _pid, uint256 _amount, uint64 _lockLength) external;
    function harvest(uint256 pid, address to) external;
    function withdrawAllAndHarvest(uint256 pid, address to) external;
    function withdrawFromDeposit(uint256 pid, uint256 amount, address to, uint256 index) external; 
    function emergencyWithdraw(uint256 pid, address to) external;
    function updatePool(uint256 pid) external;
    function tribePerBlock() external view returns (uint256);
    function massUpdatePools(uint256[] calldata pids) external;
    function pendingRewards(uint256 _pid, address _user) external view returns (uint256);
    function resetRewards(uint256 _pid) external;
    function set(uint256 _pid, uint120 _allocPoint, IRewarder _rewarder, bool overwrite) external;
    function add(uint120 allocPoint, IERC20 _stakedToken, IRewarder _rewarder, RewardData[] calldata rewardData) external;
    function getTotalStakedInPool(uint256 pid, address user) external view returns (uint256);
    function openUserDeposits(uint256 pid, address user) external view returns (uint256);
    function numPools() external view returns (uint256);
    function governorWithdrawTribe(uint256 amount) external;
    function governorAddPoolMultiplier(uint256 _pid, uint64 lockLength, uint64 newRewardsMultiplier) external;
    function unlockPool(uint256 _pid) external;
    function lockPool(uint256 _pid) external;
    function updateBlockReward(uint256 newBlockReward) external;
    function SCALE_FACTOR() external view returns (uint256);
    function totalAllocPoint() external view returns (uint256);
}
