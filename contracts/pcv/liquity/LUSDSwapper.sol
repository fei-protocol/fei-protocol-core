// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./ILUSDSwapper.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title LUSD Swapper contract
 * @notice PCV Controller to automatically buy available ETH for LUSD from B Protocol
 *
 * The BAMM compounds LUSD deposits by selling ETH into LUSD as the stability pool is utilized.
 * The ETH is exposed via a stableswap AMM curve according to the USD ETH value of the held ETH.
 * This contract swaps LUSD for that ETH along the curve when called.
 * 
 * https://docs.bprotocol.org/technical-documentation/v2
 */
contract LUSDSwapper is ILUSDSwapper, CoreRef {

    /// @notice B. Protocol LUSD Stability Pool AMM
    IBAMM public immutable override bamm;

    /// @notice Fei Protocol LUSD PCV Deposit to draw from
    /// @dev IMPORTANT: This LUSD deposit cannot be a deposit which uses B. Protocol, to prevent recursion
    IPCVDeposit public override lusdDeposit;

    /// @notice Fei Protocol ETH PCV Deposit to send to
    address public override ethDeposit;

    /**
     * @notice constructor
     * @param _core Fei Core to reference
     * @param _bamm The B. Protocol BAMM contract
     * @param _lusdDeposit The LUSD PCV Deposit to pull from for swaps
     * @param _ethDeposit The B. Protocol BAMM contract
     */
    constructor (address _core, IBAMM _bamm, address _lusdDeposit, address _ethDeposit) CoreRef(_core) {
        bamm = _bamm;

        _setLusdDeposit(_lusdDeposit);
        _setEthDeposit(_ethDeposit);

        // Approve LUSD on BAMM
        SafeERC20.safeApprove(IERC20(lusdDeposit.balanceReportedIn()), address(_bamm), type(uint256).max);
    }

    // Forward ETH received to ETH deposit
    receive() external payable {
        Address.sendValue(payable(ethDeposit), address(this).balance);
    }

    /// @notice swap LUSD from deposit on BAMM for ETH
    /// @param lusdAmount amount of LUSD to swap
    /// @param minEthReturn minimum amount of ETH received
    /// @dev admin should be intended smart contract that requires BAMM be ETH minimized
    function swapLUSD(uint256 lusdAmount, uint256 minEthReturn) external override whenNotPaused onlyGovernorOrAdmin {
        lusdDeposit.withdraw(address(this), lusdAmount);
        bamm.swap(lusdAmount, minEthReturn, ethDeposit);
    }

    /// @notice set new lusdDeposit
    /// @param newLusdDeposit Fei Protocol LUSD PCV Deposit to draw from
    function setLusdDeposit(address newLusdDeposit) external override onlyGovernorOrAdmin {
        _setLusdDeposit(newLusdDeposit);
    }

    /// @notice set new ethDeposit
    /// @param newEthDeposit Fei Protocol LUSD ETH Deposit to send to
    function setEthDeposit(address newEthDeposit) external override onlyGovernorOrAdmin {
        _setEthDeposit(newEthDeposit);
    }

    function _setLusdDeposit(address newLusdDeposit) internal {
        require(newLusdDeposit != address(0), "zero address");

        address oldLusdDeposit = address(lusdDeposit);
        lusdDeposit = IPCVDeposit(newLusdDeposit);

        emit LusdDepositUpdate(oldLusdDeposit, newLusdDeposit);
    }

    function _setEthDeposit(address newEthDeposit) internal {
        require(newEthDeposit != address(0), "zero address");

        address oldEthDeposit = ethDeposit;
        ethDeposit = newEthDeposit;

        emit EthDepositUpdate(oldEthDeposit, newEthDeposit);
    }
}