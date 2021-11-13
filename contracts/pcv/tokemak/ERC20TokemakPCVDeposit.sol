// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./TokemakPCVDepositBase.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface ITokemakERC20Pool {
    function deposit(uint256 amount) external;
    function withdraw(uint256 requestedAmount) external;
}

/// @title ERC-20 implementation for a Tokemak PCV Deposit
/// @author Fei Protocol
contract ERC20TokemakPCVDeposit is TokemakPCVDepositBase {

    /// @notice Tokemak ERC20 PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pool Tokemak pool to deposit in
    /// @param _rewards Tokemak rewards contract
    constructor(
        address _core,
        address _pool,
        address _rewards
    ) TokemakPCVDepositBase(_core, _pool, _rewards) {}

    /// @notice deposit ERC-20 tokens to Tokemak
    function deposit()
        external
        override
        whenNotPaused
    {
        uint256 amount = token.balanceOf(address(this));

        token.approve(pool, amount);

        ITokemakERC20Pool(pool).deposit(amount);

        emit Deposit(msg.sender, amount);
    }

    /// @notice withdraw tokens from the PCV allocation
    /// @param amountUnderlying of tokens withdrawn
    /// @param to the address to send PCV to
    function withdraw(address to, uint256 amountUnderlying)
        external
        override
        onlyPCVController
        whenNotPaused
    {
        ITokemakERC20Pool(pool).withdraw(amountUnderlying);

        token.transfer(to, amountUnderlying);

        emit Withdrawal(msg.sender, to, amountUnderlying);
    }
}
