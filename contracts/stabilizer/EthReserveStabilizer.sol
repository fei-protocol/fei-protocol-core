// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./ReserveStabilizer.sol";

/// @title implementation for an ETH Reserve Stabilizer
/// @author Fei Protocol
contract EthReserveStabilizer is ReserveStabilizer {

    constructor(
        address _core,
        address _oracle,
        uint256 _usdPerFeiBasisPoints
    ) ReserveStabilizer(_core, _oracle, IERC20(address(0)), _usdPerFeiBasisPoints) {}

    receive() external payable {}

    /// @notice returns the amount of the held ETH
    function balance() public view override returns(uint256) {
        return address(this).balance;
    }

    function _transfer(address to, uint256 amount) internal override {
        Address.sendValue(payable(to), amount);
    }
}
