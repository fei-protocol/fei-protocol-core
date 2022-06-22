// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract MockStakingRewards {
    uint256 public rewardAmount;

    function notifyRewardAmount(uint256 amount) external {
        rewardAmount = amount;
    }

    function recoverERC20(
        address tokenAddress,
        address to,
        uint256 tokenAmount
    ) external {
        IERC20(tokenAddress).transfer(to, tokenAmount);
    }
}
