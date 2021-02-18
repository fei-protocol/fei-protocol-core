pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStakingRewards {
    
    // ----------- Getters -----------

    function rewardsToken() external view returns(IERC20);

    function stakingToken() external view returns(IERC20);

    function periodFinish() external view returns(uint256);

    function rewardRate() external view returns(uint256);

    function rewardsDuration() external view returns(uint256);

    function lastUpdateTime() external view returns(uint256);

    function rewardPerTokenStored() external view returns(uint256);

    function userRewardPerTokenPaid(address account) external view returns(uint256);

    function rewards(address account) external view returns(uint256);

    function totalSupply() external view returns(uint256);

    function balanceOf(address account) external view returns(uint256);

    function lastTimeRewardApplicable() external view returns(uint256);

    function rewardPerToken() external view returns(uint256);

    function earned(address account) external view returns(uint256);

    function getRewardForDuration() external view returns(uint256);


    // ----------- State changing API -----------

    function stake(uint256 amount) external;

    function withdraw(uint256 amount) external;

    function getReward() external;

    function exit() external;

    // ----------- Rewards Distributor-Only State changing API -----------

    function notifyRewardAmount(uint256 reward) external;

    function recoverERC20(address tokenAddress, address to, uint256 tokenAmount) external;
}