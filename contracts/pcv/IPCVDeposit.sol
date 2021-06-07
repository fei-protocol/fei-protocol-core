// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

/// @title a PCV Deposit interface
/// @author Fei Protocol
interface IPCVDeposit {
    // ----------- Events -----------
    event Deposit(address indexed _from, uint256 _amount);

    event Withdrawal(
        address indexed _caller,
        address indexed _to,
        uint256 _amount
    );

    event WithdrawERC20(
        address indexed _caller,
        address indexed _token,
        address indexed _to,
        uint256 _amount
    );

    // ----------- State changing api -----------

    function deposit() external;

    // ----------- PCV Controller only state changing api -----------

    function withdraw(address to, uint256 amount) external;

    function withdrawERC20(address token, address to, uint256 amount) external;

    // ----------- Getters -----------

    function balance() external view returns (uint256);
}
