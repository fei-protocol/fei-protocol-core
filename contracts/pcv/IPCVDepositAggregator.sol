// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVDeposit.sol";
import "../external/Decimal.sol";

/** 
 @title a PCV Deposit aggregation interface
 @author Fei Protocol

 This contract is a single interface for allocating a specific token to multiple PCV Deposits.
 The aggregator handles new incoming funds and outgoing funds by selecting deposits which are over or under-funded to save for gas and efficiency
*/

interface IPCVDepositAggregator {
    // ----------- Events -----------

    event DepositAdded(
        address indexed depositAddress, 
        uint256 weight
    );

    event DepositRemoved(
        address indexed depositAddress
    );

    event Rebalanced(
        uint256 totalAssets
    );

    event RebalancedSingle(
        address indexed pcvDepositAddress
    );

    event CannotRebalanceSingle(
        address indexed pcvDeposit, 
        uint256 amountNeeded, 
        uint256 aggregatorBalance
    );

    event AggregatorWithdrawal(
        uint256 amount
    );

    event AggregatorDeposit();

    event AggregatorUpdate(
        address indexed oldAggregator,
        address indexed newAggregator
    );

    event AssetManagerUpdate(
        address indexed oldAssetManager,
        address indexed newAssetManager
    );

    event BufferWeightUpdate(
        uint256 oldWeight,
        uint256 newWeight
    );

    event DepositWeightUpdate(
        address indexed depositAddress, 
        uint256 oldWeight, 
        uint256 newWeight
    );

    // ----------- State changing api -----------

    /// @notice rebalance funds of the underlying deposits to the optimal target percents
    function rebalance() external;

    /// @notice same as the rebalance function, but for a single deposit
    /// @param pcvDeposit the address of the pcv deposit to attempt to rebalance
    function rebalanceSingle(address pcvDeposit) external;

    // ----------- Governor only state changing api -----------

    /// @notice adds a new PCV Deposit to the set of deposits
    /// @param weight a relative (i.e. not normalized) weight of this PCV deposit
    function addPCVDeposit(address newPCVDeposit, uint256 weight) external;

    /// @notice replaces this contract with a new PCV Deposit Aggregator on the rewardsAssetManager
    /// @param newAggregator the address of the new PCV Deposit Aggregator
    function setNewAggregator(address newAggregator) external;

    /// @notice sets the rewards asset manager
    /// @param newAssetManager the address of the new rewards asset manager
    function setAssetManager(address newAssetManager) external;

    // ----------- Governor or Admin only state changing api -----------
    /// @notice remove a PCV deposit from the set of deposits
    /// @param pcvDeposit the address of the PCV deposit to remove
    /// @param shouldRebalance whether or not we want to rebalanceSingle on that deposit address before removing but after setting the weight to zero
    function removePCVDeposit(address pcvDeposit, bool shouldRebalance) external;

    /// @notice set the relative weight of a particular pcv deposit
    /// @param depositAddress the address of the PCV deposit to set the weight of
    /// @param newDepositWeight the new relative weight of the PCV deposit
    function setPCVDepositWeight(address depositAddress, uint256 newDepositWeight) external;

    /// @notice set the weight for the buffer specifically
    /// @param weight the new weight for the buffer
    function setBufferWeight(uint256 weight) external;

    // ---------- Guardian only state changing api ----------
    /// @notice sets the weight of a pcv deposit to zero
    /// @param depositAddress the address of the pcv deposit to set the weight of to zero
    function setPCVDepositWeightZero(address depositAddress) external;

    // ----------- Read-only api -----------

    /// @notice the token that the aggregator is managing
    /// @return the address of the token that the aggregator is managing
    function token() external returns(address);

    /// @notice the upstream rewardsAssetManager funding this contract
    /// @return the address of the upstream rewardsAssetManager funding this contract
    function assetManager() external returns(address);

    /// @notice returns true if the given address is a PCV Deposit in this aggregator
    /// @param pcvDeposit the address of the PCV deposit to check
    /// @return true if the given address is a PCV Deposit in this aggregator
    function hasPCVDeposit(address pcvDeposit) external view returns (bool);

    /// @notice the set of PCV deposits and non-normalized weights this contract allocates to\
    /// @return deposits addresses and weights as uints
    function pcvDeposits() external view returns(address[] memory deposits, uint256[] memory weights);

    /// @notice current percent of PCV held by the input `pcvDeposit` relative to the total managed by aggregator.
    /// @param pcvDeposit the address of the pcvDeposit
    /// @param depositAmount a hypothetical deposit amount, to be included in the calculation
    /// @return the percent held as a Decimal D256 value
    function percentHeld(address pcvDeposit, uint256 depositAmount) external view returns(Decimal.D256 memory);

    /// @notice the normalized target weight of PCV held by `pcvDeposit` relative to aggregator total
    /// @param pcvDeposit the address of the pcvDeposit
    /// @return the normalized target percent held as a Decimal D256 value
    function normalizedTargetWeight(address pcvDeposit) external view returns(Decimal.D256 memory);

    /// @notice the raw amount of PCV off of the target weight/percent held by `pcvDeposit`
    /// @dev a positive result means the target has "too much" pcv, and a negative result means it needs more pcv
    /// @param pcvDeposit the address of the pcvDeposit
    /// @return the amount from target as an int
    function amountFromTarget(address pcvDeposit) external view returns(int256);

    /// @notice the same as amountFromTarget, but for every targets
    /// @return distancesToTargets all amounts from targets as a uint256 array
    function getAllAmountsFromTargets() external view returns(int256[] memory);

    /// @notice returns the summation of all pcv deposit balances + the aggregator's balance
    /// @return the total amount of pcv held by the aggregator and the pcv deposits
    function getTotalBalance() external view returns(uint256);

    /// @notice returns the summation of all pcv deposit's resistant balance & fei
    /// @return the resistant balance and fei as uints
    function getTotalResistantBalanceAndFei() external view returns(uint256, uint256);
}
