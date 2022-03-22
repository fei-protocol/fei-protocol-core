// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../IGuard.sol";

contract RecoverEthGuard is IGuard {
    function check() external pure override returns (bool) {
        return true;
    }

    function getProtecActions()
        external
        view
        override
        returns (
            address[] memory targets,
            bytes[] memory datas,
            uint256[] memory values
        )
    {
        targets = new address[](1);
        datas = new bytes[](1);
        values = new uint256[](1);

        targets[0] = address(this);
        datas[0] = bytes("");
        values[0] = 0.5 ether;

        return (targets, datas, values);
    }

    // Just added so that we can receive ether for the test
    fallback() external payable {}

    receive() external payable {}
}
