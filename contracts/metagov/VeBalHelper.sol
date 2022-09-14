// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.0;

import {VeBoostManager} from "./VeBoostManager.sol";
import {VeBalDelegatorPCVDeposit} from "./VeBalDelegatorPCVDeposit.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {SafeERC20, IERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {TransparentUpgradeableProxy, ProxyAdmin} from "@openzeppelin/contracts/proxy/transparent/ProxyAdmin.sol";

/// @title Helper contract for veBAL OTC
/// @author eswak
contract VeBalHelper is Ownable {
    using SafeERC20 for IERC20;

    address public constant FEI_DAO_TIMELOCK = 0xd51dbA7a94e1adEa403553A8235C302cEbF41a3c;
    VeBalDelegatorPCVDeposit public pcvDeposit;
    VeBoostManager public boostManager;

    constructor(
        address _owner,
        address _pcvDeposit,
        address _boostManager
    ) Ownable() {
        _transferOwnership(_owner);
        pcvDeposit = VeBalDelegatorPCVDeposit(_pcvDeposit);
        boostManager = VeBoostManager(_boostManager);
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
    // Boost Management
    // ----------------------------------------------------------------------------------

    /// @notice probably not needed, but if this function is called, the VeBalHelper
    /// contract will not be admin of the boostManager anymore (transfer ownership).
    /// This will make all the following functions (setVotingEscrowDelegation, create_boost,
    /// extend_boost, cancel_boost, and burn) revert, but the new owner will be able to
    /// manage boost directly.
    function transferBoostManagerOwnership(address newBoostManagerOwner) external onlyOwner {
        boostManager.transferOwnership(newBoostManagerOwner);
    }

    /// @notice Set the contract used to manage boost delegation
    /// @dev the call is gated to the same role as the role to manage veTokens
    function setVotingEscrowDelegation(address newVotingEscrowDelegation) public onlyOwner {
        boostManager.setVotingEscrowDelegation(newVotingEscrowDelegation);
    }

    /// @notice Create a boost and delegate it to another account.
    function create_boost(
        address _delegator,
        address _receiver,
        int256 _percentage,
        uint256 _cancel_time,
        uint256 _expire_time,
        uint256 _id
    ) external onlyOwner {
        boostManager.create_boost(_delegator, _receiver, _percentage, _cancel_time, _expire_time, _id);
    }

    /// @notice Extend the boost of an existing boost or expired boost
    function extend_boost(
        uint256 _token_id,
        int256 _percentage,
        uint256 _expire_time,
        uint256 _cancel_time
    ) external onlyOwner {
        boostManager.extend_boost(_token_id, _percentage, _expire_time, _cancel_time);
    }

    /// @notice Cancel an outstanding boost
    function cancel_boost(uint256 _token_id) external onlyOwner {
        boostManager.cancel_boost(_token_id);
    }

    /// @notice Destroy a token
    function burn(uint256 _token_id) external onlyOwner {
        boostManager.burn(_token_id);
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
