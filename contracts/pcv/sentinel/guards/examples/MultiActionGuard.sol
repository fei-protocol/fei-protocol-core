// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../IGuard.sol";

contract MultiACtionBalanceGuard is IGuard {
    address constant private ONE = address(0x1);
    address constant private TWO = address(0x2);
    address constant private THREE = address(0x3);
    address constant private FOUR = address(0x4);
    address constant private FIVE = address(0x5);

    function check() 
        external 
        view
        override 
        returns (bool) 
    {
        if(address(block.coinbase).balance % 2 == 0) return true;
        return false;
    }

    function getProtecActions() 
        external 
        pure 
        override 
        returns (address[] memory targets, bytes[] memory datas) 
    {
        targets = new address[](5);
        datas = new bytes[](5);

        targets[0] = ONE; targets[1] = TWO; targets[2] = THREE; targets[3] = FOUR; targets[4] = FIVE;
        datas[0] = bytes("one"); datas[1] = bytes("two"); datas[2] = bytes("three"); datas[3] = bytes("four"); datas[4] = bytes("five");

        return (targets, datas);
    }
}