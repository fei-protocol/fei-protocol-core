// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./CompoundPCVDepositBase.sol";

interface CErc20 {
    function mint(uint256 amount) external returns (uint256);
}

/// @title ERC-20 implementation for a Compound PCV Deposit
/// @author Fei Protocol
contract ERC20CompoundPCVDeposit is CompoundPCVDepositBase {

    /// @notice the token underlying the cToken
    IERC20 public token;

    /// @notice Compound ERC20 PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _cToken Compound cToken to deposit
    /// @param _token the token underlying the cToken
    constructor(
        address _core,
        address _cToken,
        IERC20 _token
    ) CompoundPCVDepositBase(_core, _cToken) {
        token = _token;
        require(!cToken.isCEther(), "ERC20CompoundPCVDeposit: Not a CErc20");
    }

    /// @notice deposit ERC-20 tokens to Compound
    function deposit()
        external
        override
        whenNotPaused
    {
        uint256 amount = token.balanceOf(address(this));

        token.approve(address(cToken), amount);

        // Compound returns non-zero when there is an error
        require(CErc20(address(cToken)).mint(amount) == 0, "ERC20CompoundPCVDeposit: deposit error");
        
        emit Deposit(msg.sender, amount);
    }

    function _transferUnderlying(address to, uint256 amount) internal override {
        SafeERC20.safeTransfer(token, to, amount);
    }
}
