// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IAuraLocker {
    struct LockedBalance {
        uint112 amount;
        uint32 unlockTime;
    }
    struct EarnedData {
        address token;
        uint256 amount;
    }

    function balanceOf(address _user) external view returns (uint256);

    function lock(address _account, uint256 _amount) external;

    function getReward(address _account, bool _stake) external;

    function processExpiredLocks(bool _relock) external;

    function emergencyWithdraw() external;

    function delegates(address account) external view returns (address);

    function getVotes(address account) external view returns (uint256);

    function lockedBalances(address _user)
        external
        view
        returns (
            uint256 total,
            uint256 unlockable,
            uint256 locked,
            LockedBalance[] memory lockData
        );

    function claimableRewards(address _account) external view returns (EarnedData[] memory userRewards);

    function notifyRewardAmount(address _rewardsToken, uint256 _reward) external;
}
