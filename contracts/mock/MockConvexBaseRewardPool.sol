// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./MockERC20.sol";

contract MockConvexBaseRewardPool is MockERC20 {
    uint256 public pid = 42;
    uint256 public rewardAmountPerClaim = 0;
    MockERC20 public rewardToken;
    MockERC20 public lpTokens;
    mapping(address => uint256) private _balances;

    constructor(address _rewardToken, address _lpTokens) {
        rewardToken = MockERC20(_rewardToken);
        lpTokens = MockERC20(_lpTokens);
    }

    function mockSetRewardAmountPerClaim(uint256 _rewardAmountPerClaim) public {
        rewardAmountPerClaim = _rewardAmountPerClaim;
    }

    function withdrawAndUnwrap(uint256 amount, bool claim)
        public
        returns (bool)
    {
        lpTokens.transfer(msg.sender, amount);
        getReward(msg.sender, claim);
        return true;
    }

    function withdrawAllAndUnwrap(bool claim) public {
        uint256 _balance = lpTokens.balanceOf(address(this));
        lpTokens.transfer(msg.sender, _balance);
        getReward(msg.sender, claim);
    }

    function getReward(address who, bool claim) public returns (bool) {
        if (rewardAmountPerClaim > 0) {
            rewardToken.mint(who, rewardAmountPerClaim);
        }
        return true;
    }

    function stakeFor(address who, uint256 amount) public returns (bool) {
        _balances[who] = amount;
    }

    function balanceOf(address who) public view override returns (uint256) {
        return _balances[who];
    }
}
