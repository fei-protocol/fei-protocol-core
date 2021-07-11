// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./CompoundPCVDeposit.sol";

interface CEth {
    function mint() external payable;
}

/// @title ETH implementation for a Compound PCV Deposit
/// @author Fei Protocol
contract EthCompoundPCVDeposit is CompoundPCVDeposit {

    /// @notice Compound ETH PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _cToken Compound cToken to deposit
    constructor(
        address _core,
        address _cToken
    ) CompoundPCVDeposit(_core, _cToken) {}

    receive() external payable {}

    /// @notice deposit ETH to Compound
    function deposit()
        external
        override
        whenNotPaused
    {
        uint256 amount = address(this).balance;

        // CEth deposits revert on failure
        CEth(address(cToken)).mint{value: amount}();
        emit Deposit(msg.sender, amount);
    }

    function _transferUnderlying(address to, uint256 amount) internal override {
        Address.sendValue(payable(to), amount);
    }
}
