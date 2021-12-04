// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IMockERC20 is IERC20 {
    function mint(address account, uint256 amount) external returns (bool);
}

contract MockAngleStakingRewards {
    IERC20 public stakingToken;
    IMockERC20 public rewardToken;

    mapping(address => uint256) public balanceOf;

	constructor(IERC20 _stakingToken, IMockERC20 _rewardToken) {
		stakingToken = _stakingToken;
        rewardToken = _rewardToken;
	}

    function stake(uint256 amount) external {
        SafeERC20.safeTransferFrom(IERC20(stakingToken), msg.sender, address(this), amount);
        balanceOf[msg.sender] += amount;
    }

    function withdraw(uint256 amount) external {
        balanceOf[msg.sender] -= amount;
        SafeERC20.safeTransfer(IERC20(stakingToken), msg.sender, amount);
    }

    function getReward() external {
        rewardToken.mint(msg.sender, balanceOf[msg.sender] / 100);
    }
}