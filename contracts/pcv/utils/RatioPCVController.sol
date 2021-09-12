// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../IPCVDeposit.sol";

/// @title a PCV controller for moving a ratio of the total value in the PCV deposit
/// @author Fei Protocol
contract RatioPCVController is CoreRef {
    
    /// @notice PCV controller constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    /// @notice withdraw tokens from the input PCV deposit in basis points terms
    /// @param pcvDeposit PCV deposit to withdraw from
    /// @param to the address to send PCV to
    /// @param basisPoints ratio of PCV to withdraw in basis points terms (1/10000)
    function withdrawRatio(IPCVDeposit pcvDeposit, address to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        require(basisPoints <= Constants.BASIS_POINTS_GRANULARITY, "RatioPCVController: basisPoints too high");
        uint256 amount = pcvDeposit.balance() * basisPoints / Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "RatioPCVController: no value to withdraw");

        pcvDeposit.withdraw(to, amount);
    }

    /// @notice withdraw a specific ERC20 token from the input PCV deposit in basis points terms
    /// @param pcvDeposit PCV deposit to withdraw from
    /// @param token the ERC20 token to withdraw
    /// @param to the address to send tokens to
    /// @param basisPoints ratio of PCV to withdraw in basis points terms (1/10000)
    function withdrawRatioERC20(IPCVDeposit pcvDeposit, address token, address to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        require(basisPoints <= Constants.BASIS_POINTS_GRANULARITY, "RatioPCVController: basisPoints too high");
        uint256 amount = IERC20(token).balanceOf(address(pcvDeposit)) * basisPoints / Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "RatioPCVController: no value to withdraw");

        pcvDeposit.withdrawERC20(token, to, amount);
    }
}
