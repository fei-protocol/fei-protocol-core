// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./ReserveStabilizer.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IWETH.sol";

/// @title implementation for an ETH Reserve Stabilizer
/// @author Fei Protocol
contract EthReserveStabilizer is ReserveStabilizer {

    /// @notice wrapped ETH address
    address public immutable WETH;

    /// @notice ETH Reserve Stabilizer constructor
    /// @param _core Fei Core to reference
    /// @param _oracle the ETH price oracle to reference
    /// @param _usdPerFeiBasisPoints the USD price per FEI to sell ETH at
    constructor(
        address _core,
        address _oracle,
        uint256 _usdPerFeiBasisPoints,
        address _WETH
    ) ReserveStabilizer(_core, _oracle, IERC20(address(0)), _usdPerFeiBasisPoints) {
        WETH = _WETH;
    }

    receive() external payable {}

    /// @notice unwraps any held WETH
    function deposit() external override {
        uint256 wethBalance = IERC20(WETH).balanceOf(address(this));
        if (wethBalance != 0) {
            IWETH(WETH).withdraw(wethBalance);
        }
    }

    /// @notice returns the amount of the held ETH
    function balance() public view override returns(uint256) {
        return address(this).balance;
    }

    function _transfer(address to, uint256 amount) internal override {
        Address.sendValue(payable(to), amount);
    }
}
