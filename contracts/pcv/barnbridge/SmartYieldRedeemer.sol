// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ISmartYield {
    function sellTokens(
        uint256 tokenAmount_,
        uint256 minUnderlying_,
        uint256 deadline_
    ) external;

    function transfer(address account, uint256 amount) external;
}

/// @title base class for a claiming BarnBridge Smar Yield tokens
/// @author Fei Protocol
contract SmartYieldRedeemer {
    using SafeERC20 for IERC20;

    address public immutable target;

    IERC20 public immutable underlying;

    constructor(address _target, IERC20 _underlying) {
        target = _target;
        underlying = _underlying;
    }

    /// @notice redeem BarnBridge SmartYield juniors
    /// @param bbJunior smart yield token to redeem from
    /// @param amount tokens to redeem
    function redeem(ISmartYield bbJunior, uint256 amount) external {
        bbJunior.sellTokens(amount, 0, block.timestamp);

        uint256 balance = underlying.balanceOf(address(this));
        underlying.safeTransfer(target, balance);
    }

    function sweep(IERC20 token, uint256 amount) external {
        token.safeTransfer(target, amount);
    }
}
