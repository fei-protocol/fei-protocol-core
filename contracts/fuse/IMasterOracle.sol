// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

interface IMasterOracle {
    function add(address[] calldata underlyings, address[] calldata _oracles) external;

    function changeAdmin(address newAdmin) external;

    function admin() external view returns (address);
}