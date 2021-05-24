// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;

/// @title a PCV Swapper interface
/// @author eswak
interface IPCVSwapper {

    // ----------- Events -----------
    event UpdateTokenSpent(address _tokenFrom);
    event UpdateTokenReceived(address _tokenTo);
    event UpdateReceivingAddress(address _tokenReceivingAddress);

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

    event WithdrawERC20(
        address indexed _caller,
        address indexed _to,
        address indexed _token,
        uint256 _amount
    );

    // ----------- State changing api -----------

    function swap() external;

    // ----------- PCV Controller only state changing api -----------

    function withdrawETH(address payable to, uint256 amount) external;
    function withdrawERC20(address to, address token, uint256 amount) external;

    // ----------- Governor only state changing api -----------

    function setTokenSpent(address _tokenSpent) external;
    function setTokenReceived(address _tokenReceived) external;
    function setReceivingAddress(address _tokenReceivingAddress) external;

    // ----------- Getters -----------

    function getTokenSpent() external view returns (address);
    function getTokenReceived() external view returns (address);
    function getReceivingAddress() external view returns (address);

}
