// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";
import "./MockConvexBaseRewardPool.sol";

contract MockConvexBooster is MockERC20 {
    MockConvexBaseRewardPool public reward;
    MockERC20 public lpToken;

    constructor(address _reward, address _lpTokens) {
        reward = MockConvexBaseRewardPool(_reward);
        lpToken = MockERC20(_lpTokens);
    }

    function deposit(
        uint256 poolId,
        uint256 lpTokens,
        bool stake
    ) public returns (bool) {
        lpToken.transferFrom(msg.sender, address(reward), lpTokens);

        if (stake) {
            reward.stakeFor(msg.sender, lpTokens);
        }

        return true;
    }
}
