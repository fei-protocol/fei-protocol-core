// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../IGuard.sol";

contract MultiActionGuard is IGuard {
    address private constant ONE = address(0x11e52c75998fe2E7928B191bfc5B25937Ca16741);
    address private constant TWO = address(0x11e52c75998fe2E7928B191bfc5B25937Ca16741);
    address private constant THREE = address(0x11e52c75998fe2E7928B191bfc5B25937Ca16741);
    address private constant FOUR = address(0x11e52c75998fe2E7928B191bfc5B25937Ca16741);
    address private constant FIVE = address(0x11e52c75998fe2E7928B191bfc5B25937Ca16741);

    function check() external view override returns (bool) {
        if (address(block.coinbase).balance % 2 == 0) return true;
        return false;
    }

    function getProtecActions()
        external
        pure
        override
        returns (
            address[] memory targets,
            bytes[] memory datas,
            uint256[] memory values
        )
    {
        targets = new address[](5);
        datas = new bytes[](5);
        values = new uint256[](5);

        targets[0] = ONE;
        targets[1] = TWO;
        targets[2] = THREE;
        targets[3] = FOUR;
        targets[4] = FIVE;
        datas[0] = bytes("one");
        datas[1] = bytes("two");
        datas[2] = bytes("three");
        datas[3] = bytes("four");
        datas[4] = bytes("five");
        values[0] = 0;
        values[1] = 0;
        values[2] = 0;
        values[3] = 0;
        values[4] = 0;

        return (targets, datas, values);
    }
}
