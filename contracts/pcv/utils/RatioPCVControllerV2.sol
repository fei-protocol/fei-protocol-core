// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "../IPCVDeposit.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title a PCV controller for moving a ratio of the total value in the PCV deposit
/// @author Fei Protocol
/// @notice v2 includes methods for transferring approved ERC20 balances and wrapping and unwrapping WETH in transit
contract RatioPCVControllerV2 is CoreRef {
    using SafeERC20 for IERC20;

    /// @notice PCV controller constructor
    /// @param _core Fei Core for reference
    constructor(
        address _core
    ) CoreRef(_core) {}

    receive() external payable {}

    /// @notice withdraw tokens from the input PCV deposit in basis points terms
    /// @param pcvDeposit PCV deposit to withdraw from
    /// @param to the address to send PCV to
    /// @param basisPoints ratio of PCV to withdraw in basis points terms (1/10000)
    function withdrawRatio(IPCVDeposit pcvDeposit, address to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        _withdrawRatio(pcvDeposit, to, basisPoints);
    }

    /// @notice withdraw WETH from the input PCV deposit in basis points terms and send as ETH
    /// @param pcvDeposit PCV deposit to withdraw from
    /// @param to the address to send PCV to
    /// @param basisPoints ratio of PCV to withdraw in basis points terms (1/10000)
    function withdrawRatioUnwrapWETH(IPCVDeposit pcvDeposit, address payable to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        uint256 amount = _withdrawRatio(pcvDeposit, address(this), basisPoints);
        _transferWETHAsETH(to, amount);
    }

    /// @notice withdraw ETH from the input PCV deposit in basis points terms and send as WETH
    /// @param pcvDeposit PCV deposit to withdraw from
    /// @param to the address to send PCV to
    /// @param basisPoints ratio of PCV to withdraw in basis points terms (1/10000)
    function withdrawRatioWrapETH(IPCVDeposit pcvDeposit, address to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        uint256 amount = _withdrawRatio(pcvDeposit, address(this), basisPoints);
        _transferETHAsWETH(to, amount);
    }

    /// @notice withdraw WETH from the input PCV deposit and send as ETH
    /// @param pcvDeposit PCV deposit to withdraw from
    /// @param to the address to send PCV to
    /// @param amount raw amount of PCV to withdraw
    function withdrawUnwrapWETH(IPCVDeposit pcvDeposit, address payable to, uint256 amount)
        public
        onlyPCVController
        whenNotPaused
    {
        pcvDeposit.withdraw(address(this), amount);
        _transferWETHAsETH(to, amount);
    }

    /// @notice withdraw ETH from the input PCV deposit and send as WETH
    /// @param pcvDeposit PCV deposit to withdraw from
    /// @param to the address to send PCV to
    /// @param amount raw amount of PCV to withdraw
    function withdrawWrapETH(IPCVDeposit pcvDeposit, address to, uint256 amount)
        public
        onlyPCVController
        whenNotPaused
    {
        pcvDeposit.withdraw(address(this), amount);
        _transferETHAsWETH(to, amount);
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

    /// @notice transfer a specific ERC20 token from the input PCV deposit in basis points terms
    /// @param from address to withdraw from
    /// @param token the ERC20 token to withdraw
    /// @param to the address to send tokens to
    /// @param basisPoints ratio of PCV to withdraw in basis points terms (1/10000)
    function transferFromRatio(address from, IERC20 token, address to, uint256 basisPoints)
        public
        onlyPCVController
        whenNotPaused
    {
        require(basisPoints <= Constants.BASIS_POINTS_GRANULARITY, "RatioPCVController: basisPoints too high");
        uint256 amount = token.balanceOf(address(from)) * basisPoints / Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "RatioPCVController: no value to transfer");

        token.safeTransferFrom(from, to, amount);
    }

    /// @notice transfer a specific ERC20 token from the input PCV deposit
    /// @param from address to withdraw from
    /// @param token the ERC20 token to withdraw
    /// @param to the address to send tokens to
    /// @param amount of tokens to transfer
    function transferFrom(address from, IERC20 token, address to, uint256 amount)
        public
        onlyPCVController
        whenNotPaused
    {
        require(amount != 0, "RatioPCVController: no value to transfer");

        token.safeTransferFrom(from, to, amount);
    }

    /// @notice send ETH as WETH
    /// @param to destination
    function transferETHAsWETH(address to)
        public
        onlyPCVController
        whenNotPaused
    {
        _transferETHAsWETH(to, address(this).balance);
    }

    /// @notice send WETH as ETH
    /// @param to destination
    function transferWETHAsETH(address payable to)
        public
        onlyPCVController
        whenNotPaused
    {
        _transferWETHAsETH(to, IERC20(address(Constants.WETH)).balanceOf(address(this)));
    }

    /// @notice send away ERC20 held on this contract, to avoid having any stuck.
    /// @param token sent
    /// @param to destination
    function transferERC20(IERC20 token, address to)
        public
        onlyPCVController
        whenNotPaused
    {
        uint256 amount = token.balanceOf(address(this));
        token.safeTransfer(to, amount);
    }

    function _withdrawRatio(IPCVDeposit pcvDeposit, address to, uint256 basisPoints) internal returns (uint256) {
        require(basisPoints <= Constants.BASIS_POINTS_GRANULARITY, "RatioPCVController: basisPoints too high");
        uint256 amount = pcvDeposit.balance() * basisPoints / Constants.BASIS_POINTS_GRANULARITY;
        require(amount != 0, "RatioPCVController: no value to withdraw");

        pcvDeposit.withdraw(to, amount);

        return amount;
    }

    function _transferETHAsWETH(address to, uint256 amount) internal {
        Constants.WETH.deposit{value: amount}();

        Constants.WETH.transfer(to, amount);
    }

    function _transferWETHAsETH(address payable to, uint256 amount) internal {
        Constants.WETH.withdraw(amount);

        Address.sendValue(to, amount);
    }
}
