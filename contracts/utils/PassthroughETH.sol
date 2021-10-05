// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../pcv/IPCVDeposit.sol";
contract AavePassthroughETH {
    address payable constant target = payable(0x5B86887e171bAE0C2C826e87E34Df8D558C079B9);
    function deposit(uint256 _amount) external payable {
        (bool success, ) = target.call{value: address(this).balance}("");
        require(success, "Address: unable to send value, recipient may have reverted");
        IPCVDeposit(target).deposit();
    }
}

contract CompoundPassthroughETH {
    address payable constant target = payable(0x4fCB1435fD42CE7ce7Af3cB2e98289F79d2962b3);
    function deposit(uint256 _amount) external payable {
        (bool success, ) = target.call{value: address(this).balance}("");
        require(success, "Address: unable to send value, recipient may have reverted");
        IPCVDeposit(target).deposit();
    }
}