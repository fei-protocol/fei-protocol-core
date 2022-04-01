// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IGuard {
    event Guarded(string reason);

    function check() external view returns (bool);

    function getProtecActions()
        external
        view
        returns (
            address[] memory targets,
            bytes[] memory datas,
            uint256[] memory values
        );
}
