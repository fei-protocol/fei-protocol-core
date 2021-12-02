// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;
pragma experimental ABIEncoderV2;

import "./ILido.sol";
import "./IWstETH.sol";
import "../PCVDeposit.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title implementation for PCV Deposit that can wrap stETH to wstETH,
/// and unwrap wstETH to stETH. All acounting is done in wstETH.
/// @author Fei Protocol
contract WstEthLidoPCVDeposit is PCVDeposit {
    using SafeERC20 for ERC20;

    // References to external contracts
    address public immutable steth;
    address public immutable wsteth;

    constructor(
        address _core,
        address _steth,
        address _wsteth
    ) CoreRef(_core) {
        steth = _steth;
        wsteth = _wsteth;
    }

    /// @notice wrap stETH held by the contract to get wstETH.
    function deposit() external override whenNotPaused {
        uint256 amountIn = IERC20(steth).balanceOf(address(this));
        require(amountIn > 0, "WstEthLidoPCVDeposit: cannot deposit 0.");

        // Wrap stETH to wstETH
        IWstETH(steth).approve(wsteth, amountIn);
        uint256 wstethOut = IWstETH(wsteth).wrap(amountIn);

        emit Deposit(msg.sender, wstethOut);
    }

    /// @notice unwrap wstETH held by the contract to get stETH.
    /// @param to the destination of the withdrawn stETH
    /// @param amountIn the number of wstETH to unwrap.
    function withdraw(address to, uint256 amountIn) external override onlyPCVController whenNotPaused {
        require(IERC20(wsteth).balanceOf(address(this)) >= amountIn, "WstEthLidoPCVDeposit: not enough wstETH.");

        // Unwrap wstETH to stETH
        uint256 stethOut = IWstETH(wsteth).unwrap(amountIn);
        ERC20(steth).safeTransfer(to, stethOut);

        emit Withdrawal(msg.sender, to, amountIn);
    }

    /// @notice Returns the current balance of wstETH held by the contract
    function balance() public view override returns (uint256 amount) {
        return IERC20(wsteth).balanceOf(address(this));
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public view override returns (address) {
        return wsteth;
    }
}
