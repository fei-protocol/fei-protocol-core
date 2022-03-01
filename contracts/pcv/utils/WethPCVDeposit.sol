// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../PCVDeposit.sol";
import "../../Constants.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title base class for a WethPCVDeposit PCV Deposit
/// @author Fei Protocol
abstract contract WethPCVDeposit is PCVDeposit {
    /// @notice Empty callback on ETH reception
    receive() external payable virtual {}

    /// @notice Wraps all ETH held by the contract to WETH
    /// Anyone can call it
    function wrapETH() public {
        uint256 ethBalance = address(this).balance;
        if (ethBalance != 0) {
            Constants.WETH.deposit{value: ethBalance}();
        }
    }

    /// @notice deposit
    function deposit() external virtual override {
        wrapETH();
    }

    /// @notice withdraw ETH from the contract
    /// @param to address to send ETH
    /// @param amountOut amount of ETH to send
    function withdrawETH(address payable to, uint256 amountOut)
        external
        override
        onlyPCVController
    {
        Constants.WETH.withdraw(amountOut);
        Address.sendValue(to, amountOut);
        emit WithdrawETH(msg.sender, to, amountOut);
    }
}
