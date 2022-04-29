// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface ITimelock {
    function becomeAdmin() external;

    function hasRole(bytes32 role, address account) external view returns (bool);

    function execute(
        address target,
        uint256 value,
        bytes calldata data,
        bytes32 predecessor,
        bytes32 salt
    ) external payable;
}
