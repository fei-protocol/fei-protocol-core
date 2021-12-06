// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./MockERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract MockTokemakRewards is MockERC20 {
    MockERC20 public rewardsToken;

    struct Recipient {
        uint256 chainId;
        uint256 cycle;
        address wallet;
        uint256 amount;
    }

    constructor(address _rewardsToken) {
        rewardsToken = MockERC20(_rewardsToken);
    }

    function claim(
        Recipient calldata recipient,
        uint8 v,
        bytes32 r,
        bytes32 s // bytes calldata signature
    ) external {
        rewardsToken.mint(recipient.wallet, recipient.amount);
    }
}
