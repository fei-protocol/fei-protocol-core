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
        uint256 indexed totalAssets
    );

    event RebalancedSingle(
        address indexed pcvDepositAddress
    );

    event CannotRebalanceSingle(
        address indexed pcvDeposit, 
        uint256 amountNeeded, 
        uint256 aggregatorBalance
        );

    event NoRebalanceNeeded(
        address indexed pcvDeposit
        );

    event AggregatorWithdrawal(
        uint256 indexed amount
    );

    event AggregatorDeposit();

    event NewAggregatorSet(
        address indexed newAggregator
    );

    event BufferWeightChanged(
        uint256 indexed bufferWeight
    );

    event DepositWeightChanged(
        address indexed depositAddress, 
        uint256 indexed oldWeight, 
        uint256 indexed newWeight
    );

    // ----------- State changing api -----------
    /// @notice rebalance funds of the underlying deposits to the optimal target percents
    function rebalance() external;

    /// @notice same as the rebalance function, but for a single deposit
    function rebalanceSingle(address pcvDeposit) external;

    // ----------- Governor only state changing api -----------
    /// @notice adds a new PCV Deposit to the set of deposits
    /// @param weight a relative (i.e. not normalized) weight of this PCV deposit
    function addPCVDeposit(address newPCVDeposit, uint256 weight) external;

    /// @notice replaces this contract with a new PCV Deposit Aggregator on the rewardsAssetManager
    function setNewAggregator(address newAggregator) external;

    // ----------- Governor or Guardian only state changing api -----------
    /// @notice remove a PCV deposit from the set of deposits
    function removePCVDeposit(address pcvDeposit) external;

    /// @notice set the relative weight of a particular pcv deposit
    function setPCVDepositWeight(address depositAddress, uint256 newDepositWeight) external;

    /// @notice set the weight for the buffer specifically
    function setBufferWeight(uint256 weight) external;

    // ----------- Read-only api -----------
    /// @notice the upstream rewardsAssetManager funding this contract
    function rewardsAssetManager() external returns(address);

    /// @notice returns true if the given address is a PCV Deposit in this aggregator
    function hasPCVDeposit(address pcvDeposit) external view returns (bool);

    /// @notice the set of PCV deposits and non-normalized weights this contract allocates to
    function pcvDeposits() external view returns(address[] memory deposits, uint256[] memory weights);

    /// @notice current percent of PCV held by the input `pcvDeposit` relative to the total managed by aggregator.
    /// @param depositAmount a hypothetical deposit amount, to be included in the calculation
    function percentHeld(address pcvDeposit, uint256 depositAmount) external view returns(Decimal.D256 memory);

    /// @notice the normalized target percent of PCV held by `pcvDeposit` relative to aggregator total
    function normalizedTargetWeight(address pcvDeposit) external view returns(Decimal.D256 memory);

    /// @notice the raw amount of PCV off of the target weight/percent held by `pcvDeposit`
    /// @dev a positive result means the target has "too much" pcv, and a negative result means it needs more pcv
    function amountFromTarget(address pcvDeposit) external view returns(int256);

    /// @notice returns the summation of all pcv deposit balances + the aggregator's balance
    function getTotalBalance() external view returns(uint256);

    /// @notice returns the summation of all pcv deposit's resistant balance & fei
    function getTotalResistantBalanceAndFei() external view returns(uint256, uint256);
}
