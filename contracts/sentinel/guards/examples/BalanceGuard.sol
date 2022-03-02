// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../IGuard.sol";

contract BalanceGuard is IGuard {
    address private constant ZERO = address(0x0);

    function check() external view override returns (bool) {
        if (address(this).balance % 2 == 0) return true;
        return false;
    }

    function getProtecActions()
        external
        pure
        override
        returns (address[] memory targets, bytes[] memory datas)
    {
        targets = new address[](1);
        datas = new bytes[](1);

        targets[0] = ZERO;
        datas[0] = bytes("");

        return (targets, datas);
    }
}
