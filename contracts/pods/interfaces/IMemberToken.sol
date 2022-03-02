// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

interface IMemberToken {
    function getNextAvailablePodId() external returns (uint256);

    function burn(address _account, uint256 _id) external;

    function mint(
        address _account,
        uint256 _id,
        bytes memory data
    ) external;
}
