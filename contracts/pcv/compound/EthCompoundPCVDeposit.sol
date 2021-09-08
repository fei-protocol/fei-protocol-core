// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "./CompoundPCVDepositBase.sol";

interface CEther {
    function mint() external payable;
}

/// @title ETH implementation for a Compound PCV Deposit
/// @author Fei Protocol
contract EthCompoundPCVDeposit is CompoundPCVDepositBase {

    /// @dev used as the reporting token address for balances
    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    /// @notice Compound ETH PCV Deposit constructor
    /// @param _core Fei Core for reference
    /// @param _cToken Compound cToken to deposit
    constructor(
        address _core,
        address _cToken
    ) CompoundPCVDepositBase(_core, _cToken) {
        // require(cToken.isCEther(), "EthCompoundPCVDeposit: Not a CEther");
    }

    receive() external payable {}

    /// @notice deposit ETH to Compound
    function deposit()
        external
        override
        whenNotPaused
    {
        uint256 amount = address(this).balance;

        // CEth deposits revert on failure
        CEther(address(cToken)).mint{value: amount}();
        emit Deposit(msg.sender, amount);
    }

    function _transferUnderlying(address to, uint256 amount) internal override {
        Address.sendValue(payable(to), amount);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public pure override returns (address) {
        return WETH;
    }
}
