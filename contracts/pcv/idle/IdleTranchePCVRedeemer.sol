// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IIdleTrancheMinter {
    function withdrawAA(uint256 _amount) external returns (uint256);

    function token() external view returns (IERC20);
}

/// @title base class for a claiming Idle tokens
/// @author Fei Protocol
contract IdleTranchePCVRedeemer {
    using SafeERC20 for IERC20;

    address public immutable target;

    IIdleTrancheMinter public immutable idleToken;

    constructor(address _target, IIdleTrancheMinter _idleToken) {
        target = _target;
        idleToken = _idleToken;
    }

    /// @notice redeem Idle Token shares
    /// @param amount asset amount to redeem
    function redeem(uint256 amount) external {
        idleToken.withdrawAA(amount);

        IERC20 token = idleToken.token();

        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(target, balance);
    }

    function sweep(IERC20 token, uint256 amount) external {
        token.safeTransfer(target, amount);
    }
}
