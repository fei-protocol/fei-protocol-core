// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVDepositAggregator.sol";
import "./PCVDeposit.sol";
import "../refs/CoreRef.sol";
import "../external/Decimal.sol";
import "./balancer/IRewardsAssetManager.sol";
import "./PCVDepositAggregator.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "../libs/UintArrayOps.sol";

/// @title ETH PCV Deposit Aggregator
/// @notice A smart contract that aggregates erc20-based PCV deposits and rebalances them according to set weights ]
contract ETHPCVDepositAggregator is PCVDepositAggregator {

    address constant WETH_ADDRESS = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    constructor(
        address _core,
        address _assetManager,
        /* address _token, */
        address[] memory _initialPCVDepositAddresses,
        uint128[] memory _initialPCVDepositWeights,
        uint128 _bufferWeight
    ) PCVDepositAggregator(
        _core,
        _assetManager,
        WETH_ADDRESS,
        _initialPCVDepositAddresses,
        _initialPCVDepositWeights,
        _bufferWeight
    ) { }

    receive() external payable {
        if (msg.value > 0) {
            wrapETH(msg.value);
        }
    }

    fallback() external payable {
        if (msg.value > 0) {
            wrapETH(msg.value);
        }
    }

    /// @notice returns the balance of the aggregator
    /// @dev if you want the total balance of the aggregator and deposits, use getTotalBalance()
    function balance() public view override returns (uint256) {
        return IERC20(token).balanceOf(address(this)) + address(this).balance;
    }

    /// @notice withdraws the specified amount of tokens from the contract
    /// @dev this is equivalent to half of a rebalance. the implementation is as follows:
    /// 1. check if the contract has enough in the buffer to cover the withdrawal. if so, just use this
    /// 2. if not, calculate what the ideal underlying amount should be for each pcv deposit *after* the withdraw
    /// 3. then, cycle through them and withdraw until each has their ideal amount (for the ones that have overages)
    /// Note this function will withdraw all of the overages from each pcv deposit, even if we don't need that much to
    /// actually cover the transfer! This is intentional because it costs the same to withdraw exactly how much we need
    /// vs the overage amount; the entire overage amount should be moved if it is the same cost as just as much as we need.
    function withdraw(address to, uint256 amount) external override onlyPCVController whenNotPaused {
        uint256 aggregatorBalance = balance();

        if (aggregatorBalance >= amount) {
            IERC20(token).safeTransfer(to, amount);
            return;
        }
        
        uint256[] memory underlyingBalances = _getUnderlyingBalances();
        uint256 totalUnderlyingBalance = underlyingBalances.sum();
        uint256 totalBalance = totalUnderlyingBalance + aggregatorBalance;

        require(totalBalance >= amount, "Not enough balance to withdraw");

        // We're going to have to pull from underlying deposits
        // To avoid the need from a rebalance, we should withdraw proportionally from each deposit
        // such that at the end of this loop, each deposit has moved towards a correct weighting
        uint256 amountNeededFromUnderlying = amount - aggregatorBalance;
        uint256 totalUnderlyingBalanceAfterWithdraw = totalUnderlyingBalance - amountNeededFromUnderlying;

        // Next, calculate exactly the desired underlying balance after withdraw
        uint[] memory idealUnderlyingBalancesPostWithdraw = new uint[](pcvDepositAddresses.length());
        for (uint256 i=0; i < pcvDepositAddresses.length(); i++) {
            idealUnderlyingBalancesPostWithdraw[i] = totalUnderlyingBalanceAfterWithdraw * pcvDepositWeights[pcvDepositAddresses.at(i)] / totalWeight;
        }

        // This basically does half of a rebalance.
        // (pulls from the deposits that have > than their post-withdraw-ideal-underlying-balance)
        for (uint256 i=0; i < pcvDepositAddresses.length(); i++) {
            address pcvDepositAddress = pcvDepositAddresses.at(i);
            uint256 actualPcvDepositBalance = underlyingBalances[i];
            uint256 idealPcvDepositBalance = idealUnderlyingBalancesPostWithdraw[i];

            if (actualPcvDepositBalance > idealPcvDepositBalance) {
                // Has post-withdraw-overage; let's take it
                uint256 amountToWithdraw = actualPcvDepositBalance - idealPcvDepositBalance;
                IPCVDeposit(pcvDepositAddress).withdraw(address(this), amountToWithdraw);
            }
        }

        sendValue(to, amount);

        emit AggregatorWithdrawal(amount);
    }

    // Transfers amount to to and calls deposit on the underlying pcv deposit
    function _depositToUnderlying(address to, uint256 amount) internal override {
        unwrapWETH(amount);
        sendValue(to, amount);
        IPCVDeposit(to).deposit();
    }
}