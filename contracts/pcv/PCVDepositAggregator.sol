// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVDepositAggregator.sol";
import "./PCVDeposit.sol";
import "../refs/CoreRef.sol";
import "../external/Decimal.sol";
import "./balancer/IRewardsAssetManager.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "../libs/UintArrayOps.sol";
import "@openzeppelin/contracts/utils/math/Math.sol";

/// @title PCV Deposit Aggregator
/// @notice A smart contract that aggregates erc20-based PCV deposits and rebalances them according to set weights 
contract PCVDepositAggregator is IPCVDepositAggregator, PCVDeposit {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeCast for int256;
    using Decimal for Decimal.D256;
    using UintArrayOps for uint256[];

    // ---------- Properties ----------

    EnumerableSet.AddressSet private pcvDepositAddresses;
    mapping(address => uint256) public pcvDepositWeights;
    
    // Bufferweights is the weight of the aggregator itself
    uint256 public bufferWeight;

    // Totalweight is the sum of all deposit weights + the buffer weight
    uint256 public totalWeight; 

    // The token that this aggregator deals with. Cannot be changed.
    address public immutable override token;

    // The asset manager that controls the rewards for this aggregator
    address public override assetManager;

    constructor(
        address _core,
        address _assetManager,
        address _token,
        address[] memory _initialPCVDepositAddresses,
        uint128[] memory _initialPCVDepositWeights,
        uint128 _bufferWeight
    ) CoreRef(_core) {
        require(_initialPCVDepositAddresses.length == _initialPCVDepositWeights.length, "Addresses and weights are not the same length!");
        require(_assetManager != address(0x0), "Rewards asset manager cannot be null");
        require(IRewardsAssetManager(_assetManager).getToken() == _token, "Rewards asset manager must be for the same token as this.");

        // Can't use the internal method here because it reads token(), which is an immutable var - immutable vars cannot be read in the constructor
        assetManager = _assetManager;
        token = _token;

        _setBufferWeight(_bufferWeight);
        _setContractAdminRole(keccak256("AGGREGATOR_ADMIN_ROLE"));

        for (uint256 i=0; i < _initialPCVDepositAddresses.length; i++) {
            require(IPCVDeposit(_initialPCVDepositAddresses[i]).balanceReportedIn() == _token, "Deposit token must be the same as for this aggregator.");
            _addPCVDeposit(_initialPCVDepositAddresses[i], _initialPCVDepositWeights[i]);
        }
    }

    // ---------- Public Functions -------------

    /// @notice deposits tokens into sub-contracts (if needed)
    /// 1. fill the buffer to maximum
    /// 2. if buffer is full and there are still tokens unallocated, calculate the optimal distribution of tokens to sub-contracts
    /// 3. distribute the tokens according the calcluations in step 2
    function deposit() external override whenNotPaused {
        // First grab the aggregator balance & the pcv deposit balances, and the sum of the pcv deposit balances
        (uint256 actualAggregatorBalance, uint256 underlyingSum, uint256[] memory underlyingBalances) = _getUnderlyingBalancesAndSum();
        uint256 totalBalance = underlyingSum + actualAggregatorBalance;

        // Optimal aggregator balance is (bufferWeight/totalWeight) * totalBalance
        uint256 optimalAggregatorBalance = bufferWeight * totalBalance / totalWeight;

        // if actual aggregator balance is below optimal, we shouldn't deposit to underlying - just "fill up the buffer"
        if (actualAggregatorBalance <= optimalAggregatorBalance) {
            return;
        }

        // we should fill up the buffer before sending out to sub-deposits
        uint256 amountAvailableForUnderlyingDeposits = optimalAggregatorBalance - actualAggregatorBalance;

        // calculate the amount that each pcv deposit needs. if they have an overage this is 0.
        uint256[] memory optimalUnderlyingBalances = _getOptimalUnderlyingBalances(totalBalance);
        uint256[] memory amountsNeeded = optimalUnderlyingBalances.positiveDifference(underlyingBalances);
        uint256 totalAmountNeeded = amountsNeeded.sum();

        // calculate a scalar. this will determine how much we *actually* send to each underlying deposit.
        Decimal.D256 memory scalar = Decimal.ratio(amountAvailableForUnderlyingDeposits, totalAmountNeeded);
        assert(scalar.asUint256() <= 1);

        for (uint256 i=0; i <underlyingBalances.length; i++) {
            // send scalar * the amount the underlying deposit needs
            uint256 amountToSend = scalar.mul(amountsNeeded[i]).asUint256();
            if (amountToSend > 0) {
                _depositToUnderlying(pcvDepositAddresses.at(i), amountToSend);
            }
        }

        emit AggregatorDeposit();
    }

    /// @notice tops up a deposit from the aggregator's balance
    /// @param pcvDeposit the address of the pcv deposit to top up
    /// @dev this will only pull from the balance that is left over after the aggregator's buffer fills up
    function depositSingle(address pcvDeposit) public override whenNotPaused {
        // First grab the aggregator balance & the pcv deposit balances, and the sum of the pcv deposit balances
        (uint256 actualAggregatorBalance, uint256 underlyingSum,) = _getUnderlyingBalancesAndSum();

        // Optimal aggregator balance is (bufferWeight/totalWeight) * totalBalance
        uint256 totalBalance = underlyingSum + actualAggregatorBalance;
        uint256 optimalAggregatorBalance = bufferWeight * totalBalance / totalWeight;

        require(actualAggregatorBalance > optimalAggregatorBalance, "No overage in aggregator to top up deposit.");

        // Calculate the overage that the aggregator has, and use the total balance to get the optimal balance of the pcv deposit
        // Then make sure it actually needs to be topped up
        uint256 aggregatorOverage = actualAggregatorBalance - optimalAggregatorBalance;
        uint256 optimalDepositBalance = _getOptimalUnderlyingBalance(totalBalance, pcvDeposit);
        uint256 actualDepositBalance = IPCVDeposit(pcvDeposit).balance();

        require(actualDepositBalance < optimalDepositBalance, "Deposit does not need topping up.");

        // If we don't have enough overage to send the whole amount, send as much as we can
        uint256 amountToSend = Math.min(optimalDepositBalance - actualDepositBalance, aggregatorOverage);

        _depositToUnderlying(pcvDeposit, amountToSend);

        emit AggregatorDepositSingle(pcvDeposit, amountToSend);
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

        IERC20(token).safeTransfer(to, amount);

        emit AggregatorWithdrawal(amount);
    }

    /// @notice set the weight for the buffer specifically
    /// @param newBufferWeight the new weight for the buffer
    function setBufferWeight(uint256 newBufferWeight) external override onlyGovernorOrAdmin {
        _setBufferWeight(newBufferWeight);
    }

    /// @notice set the relative weight of a particular pcv deposit
    /// @param depositAddress the address of the PCV deposit to set the weight of
    /// @param newDepositWeight the new relative weight of the PCV deposit
    function setPCVDepositWeight(address depositAddress, uint256 newDepositWeight) external override onlyGovernorOrAdmin {
        require(pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        uint256 oldDepositWeight = pcvDepositWeights[depositAddress];
        int256 difference = newDepositWeight.toInt256() - oldDepositWeight.toInt256();
        pcvDepositWeights[depositAddress] = newDepositWeight;

        totalWeight = (totalWeight.toInt256() + difference).toUint256();

        emit DepositWeightUpdate(depositAddress, oldDepositWeight, newDepositWeight);
    }

    /// @notice sets the weight of a pcv deposit to zero
    /// @param depositAddress the address of the pcv deposit to set the weight of to zero
    function setPCVDepositWeightZero(address depositAddress) external override onlyGuardianOrGovernor {
        require(pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        uint256 oldDepositWeight = pcvDepositWeights[depositAddress];
        pcvDepositWeights[depositAddress] = 0;

        totalWeight = totalWeight - oldDepositWeight;

        emit DepositWeightUpdate(depositAddress, oldDepositWeight, 0);
    }

    /// @notice remove a PCV deposit from the set of deposits
    /// @param pcvDeposit the address of the PCV deposit to remove
    /// @param shouldWithdraw whether or not we want to withdraw from the pcv deposit before removing
    function removePCVDeposit(address pcvDeposit, bool shouldWithdraw) external override onlyGovernorOrAdmin {
        _removePCVDeposit(address(pcvDeposit), shouldWithdraw);
    }

    /// @notice adds a new PCV Deposit to the set of deposits
    /// @param weight a relative (i.e. not normalized) weight of this PCV deposit
    /// @dev the require check here is not in the internal method because the token var (as an immutable var) cannot be read in the constructor
    function addPCVDeposit(address newPCVDeposit, uint256 weight) external override onlyGovernorOrAdmin {
        require(IPCVDeposit(newPCVDeposit).balanceReportedIn() == token, "Deposit token must be the same as for this aggregator.");

        _addPCVDeposit(newPCVDeposit, weight);
    }

    /// @notice replaces this contract with a new PCV Deposit Aggregator on the rewardsAssetManager
    /// @param newAggregator the address of the new PCV Deposit Aggregator
    function setNewAggregator(address newAggregator) external override onlyGovernor {
        require(PCVDepositAggregator(newAggregator).token() == token, "New aggregator must be for the same token as the existing.");

        // Send old aggregator assets over to the new aggregator
        IERC20(token).safeTransfer(newAggregator, balance());

        // No need to remove all deposits, this is a lot of extra gas.

        // Finally, set the new aggregator on the rewards asset manager itself
        IRewardsAssetManager(assetManager).setNewAggregator(newAggregator);

        emit AggregatorUpdate(address(this), newAggregator);
    }

    /// @notice sets the rewards asset manager
    /// @param newAssetManager the address of the new rewards asset manager
    function setAssetManager(address newAssetManager) external override onlyGovernor {
        _setAssetManager(newAssetManager);
    }

    // ---------- View Functions ---------------

    /// @notice returns true if the given address is a PCV Deposit in this aggregator
    /// @param pcvDeposit the address of the PCV deposit to check
    /// @return true if the given address is a PCV Deposit in this aggregator
    function hasPCVDeposit(address pcvDeposit) public view override returns (bool) {
        return pcvDepositAddresses.contains(pcvDeposit);
    }

    /// @notice returns the contract's resistant balance and fei
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        return (balance(), 0);
    }

    /// @notice returns the address of the token that this contract holds
    function balanceReportedIn() external view override returns (address) {
        return token;
    }

    /// @notice returns the balance of the aggregator
    /// @dev if you want the total balance of the aggregator and deposits, use getTotalBalance()
    function balance() public view override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    /// @notice current percent of PCV held by the input `pcvDeposit` relative to the total managed by aggregator.
    /// @param pcvDeposit the address of the pcvDeposit
    /// @param depositAmount a hypothetical deposit amount, to be included in the calculation
    /// @return the percent held as a Decimal D256 value
    function percentHeld(address pcvDeposit, uint256 depositAmount) external view override returns(Decimal.D256 memory) {
        uint256 totalBalanceWithTheoreticalDeposit = getTotalBalance() + depositAmount;
        uint256 targetBalanceWithTheoreticalDeposit = IPCVDeposit(pcvDeposit).balance() + depositAmount;

        return Decimal.ratio(targetBalanceWithTheoreticalDeposit, totalBalanceWithTheoreticalDeposit);
    }

    /// @notice the normalized target weight of PCV held by `pcvDeposit` relative to aggregator total
    /// @param pcvDeposit the address of the pcvDeposit
    /// @return the normalized target percent held as a Decimal D256 value
    function normalizedTargetWeight(address pcvDeposit) public view override returns(Decimal.D256 memory) {
        return Decimal.ratio(pcvDepositWeights[pcvDeposit], totalWeight);
    }

    /// @notice the raw amount of PCV off of the target weight/percent held by `pcvDeposit`
    /// @dev a positive result means the target has "too much" pcv, and a negative result means it needs more pcv
    /// @param pcvDeposit the address of the pcvDeposit
    /// @return the amount from target as an int
    function amountFromTarget(address pcvDeposit) public view override returns(int256) {
        uint256 totalBalance = getTotalBalance();

        uint256 pcvDepositBalance = IPCVDeposit(pcvDeposit).balance();
        uint256 pcvDepositWeight = pcvDepositWeights[address(pcvDeposit)];

        uint256 idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;
        
        return (pcvDepositBalance).toInt256() - (idealDepositBalance).toInt256();
    }

    /// @notice the same as amountFromTarget, but for every targets
    /// @return distancesToTargets all amounts from targets as a uint256 array
    function getAllAmountsFromTargets() public view override returns(int256[] memory distancesToTargets) {
        (uint256 aggregatorBalance, uint256 underlyingSum, uint256[] memory underlyingBalances) = _getUnderlyingBalancesAndSum();
        uint256 totalBalance = aggregatorBalance + underlyingSum;

        distancesToTargets = new int256[](pcvDepositAddresses.length());

        for (uint256 i=0; i < distancesToTargets.length; i++) {
            uint256 idealAmount = totalBalance * pcvDepositWeights[pcvDepositAddresses.at(i)] / totalWeight;
            distancesToTargets[i] = (idealAmount).toInt256() - (underlyingBalances[i]).toInt256();
        }

        return distancesToTargets;
    }

    /// @notice the set of PCV deposits and non-normalized weights this contract allocates to\
    /// @return deposits addresses and weights as uints
    function pcvDeposits() external view override returns(address[] memory deposits, uint256[] memory weights) {
        deposits = new address[](pcvDepositAddresses.length());
        weights = new uint256[](pcvDepositAddresses.length());

        for (uint256 i=0; i < pcvDepositAddresses.length(); i++) {
            deposits[i] = pcvDepositAddresses.at(i);
            weights[i] = pcvDepositWeights[pcvDepositAddresses.at(i)];
        }

        return (deposits, weights);
    }

    /// @notice returns the summation of all pcv deposit balances + the aggregator's balance
    /// @return the total amount of pcv held by the aggregator and the pcv deposits
    function getTotalBalance() public view override returns (uint256) {
        return _getUnderlyingBalances().sum() + balance();
    }

    /// @notice returns the summation of all pcv deposit's resistant balance & fei
    /// @return the resistant balance and fei as uints
    function getTotalResistantBalanceAndFei() external view override returns (uint256, uint256) {
        uint256 totalResistantBalance = 0;
        uint256 totalResistantFei = 0;

        for (uint256 i=0; i<pcvDepositAddresses.length(); i++) {
            (uint256 resistantBalance, uint256 resistantFei) = IPCVDeposit(pcvDepositAddresses.at(i)).resistantBalanceAndFei();

            totalResistantBalance += resistantBalance;
            totalResistantFei += resistantFei;
        }

        // Let's not forget to get this balance
        totalResistantBalance += balance();

        // There's no Fei to add

        return (totalResistantBalance, totalResistantFei);
    }

    // ---------- Internal Functions ----------- //

    // Sets the asset manager
    function _setAssetManager(address newAssetManager) internal {
        require(newAssetManager != address(0x0), "New asset manager cannot be 0x0");
        require(IRewardsAssetManager(newAssetManager).getToken() == token, "New asset manager must be for the same token as the existing.");

        address oldAssetManager = assetManager;
        assetManager = newAssetManager;

        emit AssetManagerUpdate(oldAssetManager, newAssetManager);
    }

    // Sets the buffer weight and updates the total weight
    function _setBufferWeight(uint256 newBufferWeight) internal {
        int256 difference = newBufferWeight.toInt256() - bufferWeight.toInt256();
        uint256 oldBufferWeight = bufferWeight;
        bufferWeight = newBufferWeight;

        totalWeight = (totalWeight.toInt256() + difference).toUint256();

        emit BufferWeightUpdate(oldBufferWeight, newBufferWeight);
    }

    // Sums the underlying deposit balances, returns the sum, the balances, and the aggregator balance
    function _getUnderlyingBalancesAndSum() internal view returns (uint256 aggregatorBalance, uint256 depositSum, uint[] memory depositBalances) {
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        return (balance(), underlyingBalances.sum(), underlyingBalances);
    }

    // Transfers amount to to and calls deposit on the underlying pcv deposit
    function _depositToUnderlying(address to, uint256 amount) internal {
        IERC20(token).transfer(to, amount);
        IPCVDeposit(to).deposit();
    }

    // Uses the weights, the total weight, and the total balance to calculate the optimal underlying pcv deposit balances
    function _getOptimalUnderlyingBalances(uint256 totalBalance) internal view returns (uint[] memory optimalUnderlyingBalances) {
        optimalUnderlyingBalances = new uint[](pcvDepositAddresses.length());

        for (uint256 i=0; i<optimalUnderlyingBalances.length; i++) {
            optimalUnderlyingBalances[i] = pcvDepositWeights[pcvDepositAddresses.at(i)] * totalBalance / totalWeight;
        }

        return optimalUnderlyingBalances;
    }

    // Optimized version of _getOptimalUnderlyingBalances for a single deposit
    function _getOptimalUnderlyingBalance(uint256 totalBalance, address pcvDeposit) internal view returns (uint256 optimalUnderlyingBalance) {
        return pcvDepositWeights[pcvDeposit] * totalBalance / totalWeight;
    }

    // Cycles through the underlying pcv deposits and gets their balances
    function _getUnderlyingBalances() internal view returns (uint[] memory) {
        uint[] memory balances = new uint[](pcvDepositAddresses.length());

        for (uint256 i=0; i<pcvDepositAddresses.length(); i++) {
            balances[i] = IPCVDeposit(pcvDepositAddresses.at(i)).balance();
        }

        return balances;
    }

    // Adds a pcv deposit if not already added
    function _addPCVDeposit(address depositAddress, uint256 weight) internal {
        require(!pcvDepositAddresses.contains(depositAddress), "Deposit already added.");

        pcvDepositAddresses.add(depositAddress);
        pcvDepositWeights[depositAddress] = weight;

        totalWeight = totalWeight + weight;

        emit DepositAdded(depositAddress, weight);
    }

    // Removes a pcv deposit if it exists
    function _removePCVDeposit(address depositAddress, bool shouldWithdraw) internal {
        require(pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        // Set the PCV Deposit weight to 0
        totalWeight = totalWeight - pcvDepositWeights[depositAddress];
        pcvDepositWeights[depositAddress] = 0;

        pcvDepositAddresses.remove(depositAddress);

        if (shouldWithdraw) {
            uint depositBalance = IPCVDeposit(depositAddress).balance();
            IPCVDeposit(depositAddress).withdraw(address(this), depositBalance);
        }

        emit DepositRemoved(depositAddress);
    }
}