// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./IPCVDeposit.sol";

/// @title a PCV Swapper interface
/// @author eswak
interface IPCVSwapper is IPCVDeposit {

    // ----------- Events -----------
    event UpdateReceivingAddress(address oldTokenReceivingAddress, address newTokenReceivingAddress);

    event Swap(
        address indexed _caller,
        address indexed _tokenSpent,
        address indexed _tokenReceived,
        uint256 _amountSpent,
        uint256 _amountReceived
    );

    event WithdrawETH(
        address indexed _caller,
        address indexed _to,
        uint256 _amount
    );

    // ----------- State changing api -----------

    function swap() external;

    // ----------- PCV Controller only state changing api -----------

    function withdrawETH(address payable to, uint256 amount) external;

    // ----------- Governor only state changing api -----------

    function setReceivingAddress(address _tokenReceivingAddress) external;

    // ----------- Getters -----------

    function tokenSpent() external view returns (address);
    function tokenReceived() external view returns (address);
    function tokenReceivingAddress() external view returns (address);

}
