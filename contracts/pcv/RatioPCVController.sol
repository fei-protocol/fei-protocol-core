// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import "../refs/CoreRef.sol";
import "./IPCVDeposit.sol";

/// @title a PCV controller for moving a ratio of the total value in the PCV deposit
/// @author Fei Protocol
contract RatioPCVController is CoreRef {
    
    uint256 public constant BASIS_POINTS_GRANULARITY = 10_000;

    /// @notice PCV controller constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    /// @notice withdraw tokens from the input PCV deposit in basis points terms
    /// @param to the address to send PCV to
    function withdrawRatio(IPCVDeposit pcvDeposit, address to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        require(basisPoints <= BASIS_POINTS_GRANULARITY, "RatioPCVController: basisPoints too high");
        uint256 amount = pcvDeposit.balance() * basisPoints / BASIS_POINTS_GRANULARITY;
        require(amount != 0, "RatioPCVController: no value to withdraw");

        pcvDeposit.withdraw(to, amount);
    }

    /// @notice withdraw a specific ERC20 token from the input PCV deposit in basis points terms
    /// @param to the address to send tokens to
    function withdrawRatioERC20(IPCVDeposit pcvDeposit, address token, address to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        require(basisPoints <= BASIS_POINTS_GRANULARITY, "RatioPCVController: basisPoints too high");
        uint256 amount = IERC20(token).balanceOf(address(pcvDeposit)) * basisPoints / BASIS_POINTS_GRANULARITY;
        require(amount != 0, "RatioPCVController: no value to withdraw");

        pcvDeposit.withdrawERC20(token, to, amount);
    }
}
