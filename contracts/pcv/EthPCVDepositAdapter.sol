// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.6.0;
pragma experimental ABIEncoderV2;

import "./IPCVDeposit.sol";
import "@openzeppelin/contracts/utils/Address.sol";

/// @title an adapter for moving ETH to and from PCV Deposit contracts with other ETH receivable contracts
/// @author Fei Protocol
contract EthPCVDepositAdapter {

    /// @notice address to deposit to
    IPCVDeposit public target;

    /// @notice PCV deposit adapter constructor
    /// @param _target PCV deposit target
    constructor(
        address _target
    ) public {
        target = IPCVDeposit(_target);
    }

    receive() external payable {
        target.deposit{value: msg.value}(msg.value);
    }

    /// @notice send amount ETH to target
    /// @param amount the amount
    function deposit(uint256 amount)
        public
        payable
    {
        require(
            msg.value == amount,
            "EthPCVDepositAdapter: Sent value does not equal input"
        );
        Address.sendValue(payable(address(target)), amount);
    }
}
