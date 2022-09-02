// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {VeBalDelegatorPCVDeposit} from "./VeBalDelegatorPCVDeposit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {TransparentUpgradeableProxy, ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/// @title Helper contract for veBAL OTC
/// @author eswak
contract VeBalHelper is Ownable {
    using SafeERC20 for IERC20;

    TransparentUpgradeableProxy public constant BOOST_RECIPIENT_PROXY =
        TransparentUpgradeableProxy(payable(address(0x66977Ce30049CD0e443216Bf26377966c3A109E2)));

    VeBalDelegatorPCVDeposit public immutable pcvDeposit;
    IERC20 public immutable otcToken;
    uint256 public immutable otcAmount;
    address public immutable otcDestination;
    address public immutable otcBuyer;

    constructor(
        address _owner,
        address _pcvDeposit,
        address _otcToken,
        uint256 _otcAmount,
        address _otcDestination,
        address _otcBuyer
    ) Ownable() {
        _transferOwnership(_owner);
        pcvDeposit = VeBalDelegatorPCVDeposit(_pcvDeposit);
        otcToken = IERC20(_otcToken);
        otcAmount = _otcAmount;
        otcDestination = _otcDestination;
        otcBuyer = _otcBuyer;
    }

    // ----------------------------------------------------------------------------------
    // OTC Management
    // ----------------------------------------------------------------------------------

    /// @notice perform OTC
    function otcBuy() external {
        require(msg.sender == otcBuyer, "UNAUTHORIZED");
        otcToken.safeTransferFrom(msg.sender, otcDestination, otcAmount);
        _transferOwnership(msg.sender);
        BOOST_RECIPIENT_PROXY.changeAdmin(msg.sender);
    }

    // ----------------------------------------------------------------------------------
    // Delegation Management
    // ----------------------------------------------------------------------------------

    /// @notice sets the snapshot delegate
    function setDelegate(address newDelegate) external onlyOwner {
        pcvDeposit.setDelegate(newDelegate);
    }

    // ----------------------------------------------------------------------------------
    // Vote-lock Management
    // ----------------------------------------------------------------------------------

    /// @notice Set the amount of time tokens will be vote-escrowed for in lock() calls
    function setLockDuration(uint256 newLockDuration) external onlyOwner {
        pcvDeposit.setLockDuration(newLockDuration);
    }

    /// @notice Deposit tokens to get veTokens. Set lock duration to lockDuration.
    function lock() external onlyOwner {
        pcvDeposit.lock();
    }

    /// @notice Exit the veToken lock.
    function exitLock() external onlyOwner {
        pcvDeposit.exitLock();
    }

    // ----------------------------------------------------------------------------------
    // Gauge Management
    // ----------------------------------------------------------------------------------

    /// @notice Set the gauge controller used for gauge weight voting
    function setGaugeController(address gaugeController) external onlyOwner {
        pcvDeposit.setGaugeController(gaugeController);
    }

    /// @notice Vote for a gauge's weight
    function voteForGaugeWeight(
        address token,
        address gaugeAddress,
        uint256 gaugeWeight
    ) external onlyOwner {
        pcvDeposit.setTokenToGauge(token, gaugeAddress);
        pcvDeposit.voteForGaugeWeight(token, gaugeWeight);
    }

    // ----------------------------------------------------------------------------------
    // Assets Management
    // ----------------------------------------------------------------------------------

    /// @notice Withdraw ERC20 tokens that are on the pcvDeposit
    /// @dev this will be needed to withdraw B-80BAL-20WETH after exitLock(),
    /// but also to withdraw BAL and bb-a-usd earned from protocol fees
    function withdrawERC20(
        address token,
        address to,
        uint256 amount
    ) external onlyOwner {
        pcvDeposit.withdrawERC20(token, to, amount);
    }
}