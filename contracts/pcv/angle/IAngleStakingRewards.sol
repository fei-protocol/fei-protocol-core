// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

// Angle StakingRewards contract
interface IAngleStakingRewards {
    function stakingToken() external returns (address);

    function balanceOf(address account) external view returns (uint256);

    function stake(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function getReward() external;
}
