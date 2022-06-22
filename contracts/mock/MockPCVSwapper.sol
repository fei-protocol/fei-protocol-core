// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

contract MockPCVSwapper {
    bool public swapped;

    function swap() public {
        swapped = true;
    }
}
