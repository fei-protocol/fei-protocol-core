// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./TokemakPCVDepositBase.sol";
import "../../Constants.sol";

interface ITokemakEthPool {
    function deposit(uint256 amount) external payable;
    function withdraw(uint256 requestedAmount, bool asEth) external;
}

/// @title ETH implementation for a Tokemak PCV Deposit
/// @author Fei Protocol
contract EthTokemakPCVDeposit is TokemakPCVDepositBase {

    /// @notice Tokemak ETH PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _pool Tokemak pool to deposit in
    /// @param _rewards Tokemak rewards contract
    constructor(
        address _core,
        address _pool,
        address _rewards
    ) TokemakPCVDepositBase(_core, _pool, _rewards) {}

    receive() external payable {}

    /// @notice deposit ETH to Tokemak
    function deposit()
        external
        override
        whenNotPaused
    {
        uint256 amount = address(this).balance;

        ITokemakEthPool(pool).deposit{value: amount}(amount);

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
        ITokemakEthPool(pool).withdraw(amountUnderlying, true);

        Address.sendValue(payable(to), amountUnderlying);

        emit Withdrawal(msg.sender, to, amountUnderlying);
    }
}
