// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../IGuard.sol";

contract ReEntrancyGuard is IGuard {
    address constant private EVIL_ADDRESS = address(0xDEADDEAD);

    function check() 
        external 
        pure 
        override 
        returns (bool) 
    {
        return true;
    }

    function getProtecActions() 
        external 
        view
        override 
        returns (address[] memory targets, bytes[] memory datas) 
    {
        targets = new address[](1);
        datas = new bytes[](1);

        targets[0] = msg.sender;
        datas[0] = abi.encodeWithSignature("knight(address)", EVIL_ADDRESS);

        return (targets, datas);
    }
}