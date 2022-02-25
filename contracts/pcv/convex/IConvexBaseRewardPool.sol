// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

interface IConvexBaseRewardPool {
    function rewardToken() external view returns (address);

    function stakingToken() external view returns (address);

    function duration() external view returns (uint256);

    function operator() external view returns (address);

    function rewardManager() external view returns (address);

    function pid() external view returns (uint256);

    function periodFinish() external view returns (uint256);

    function rewardRate() external view returns (uint256);

    function lastUpdateTime() external view returns (uint256);

    function rewardPerTokenStored() external view returns (uint256);

    function queuedRewards() external view returns (uint256);

    function currentRewards() external view returns (uint256);

    function historicalRewards() external view returns (uint256);

    function newRewardRatio() external view returns (uint256);

    function userRewardPerTokenPaid(address user)
        external
        view
        returns (uint256);

    function rewards(address user) external view returns (uint256);

    function extraRewards(uint256 i) external view returns (address);

    function totalSupply() external view returns (uint256);

    function balanceOf(address account) external view returns (uint256);

    function extraRewardsLength() external view returns (uint256);

    function addExtraReward(address _reward) external returns (bool);

    function clearExtraRewards() external;

    function lastTimeRewardApplicable() external view returns (uint256);

    function rewardPerToken() external view returns (uint256);

    function earned(address account) external view returns (uint256);

    function stake(uint256 _amount) external returns (bool);

    function stakeAll() external returns (bool);

    function stakeFor(address _for, uint256 _amount) external returns (bool);

    function withdraw(uint256 amount, bool claim) external returns (bool);

    function withdrawAll(bool claim) external;

    function withdrawAndUnwrap(uint256 amount, bool claim)
        external
        returns (bool);

    function withdrawAllAndUnwrap(bool claim) external;

    function getReward(address _account, bool _claimExtras)
        external
        returns (bool);

    function getReward() external returns (bool);

    function donate(uint256 _amount) external returns (bool);

    function queueNewRewards(uint256 _rewards) external returns (bool);
}
