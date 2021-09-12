// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ReserveStabilizer.sol";
import "../Constants.sol";

/// @title implementation for an ETH Reserve Stabilizer
/// @author Fei Protocol
contract EthReserveStabilizer is ReserveStabilizer {

    /// @notice ETH Reserve Stabilizer constructor
    /// @param _core Fei Core to reference
    /// @param _oracle the ETH price oracle to reference
    /// @param _backupOracle the backup oracle to reference
    /// @param _usdPerFeiBasisPoints the USD price per FEI to sell ETH at
    constructor(
        address _core,
        address _oracle,
        address _backupOracle,
        uint256 _usdPerFeiBasisPoints
    ) ReserveStabilizer(_core, _oracle, _backupOracle, IERC20(address(Constants.WETH)), _usdPerFeiBasisPoints) {}

    receive() external payable {}

    /// @notice unwraps any held WETH
    function deposit() external override {
        IERC20 erc20Weth = IERC20(address(Constants.WETH));
        uint256 wethBalance = erc20Weth.balanceOf(address(this));
        if (wethBalance != 0) {
            Constants.WETH.withdraw(wethBalance);
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
