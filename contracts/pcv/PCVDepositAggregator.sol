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
import "hardhat/console.sol";

library UintArrayOps {
    function sum(uint[] memory array) internal pure returns (uint256 _sum) {
        for (uint256 i=0; i < array.length; i++) {
            _sum += array[i];
        }

        return _sum;
    }

    function difference(uint[] memory a, uint[] memory b) internal pure returns (int[] memory _difference) {
        require(a.length == b.length, "Arrays must be the same length");

        _difference = new int[](a.length);

        for (uint256 i=0; i < a.length; i++) {
            _difference[i] = int(a[i]) - int(b[i]);
        }

        return _difference;
    }

    function positiveDifference(uint[] memory a, uint[] memory b) internal pure returns (uint[] memory _positiveDifference) {
        require(a.length == b.length,  "Arrays must be the same length");

        _positiveDifference = new uint[](a.length);

        for (uint256 i=0; i < a.length; i++) {
            if (a[i] > b[i]) {
                _positiveDifference[i] = a[i] - b[i];
            }
        }

        return _positiveDifference;
    }
}

contract PCVDepositAggregator is IPCVDepositAggregator, IPCVDeposit, CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeCast for int256;
    using UintArrayOps for uint[];

    // ---------- Properties ------

    EnumerableSet.AddressSet private pcvDepositAddresses;
    mapping(address => uint) public pcvDepositWeights;
    
    uint256 public bufferWeight;
    uint256 public totalWeight; 

    address public token;
    address public override rewardsAssetManager;

    constructor(
        address _core,
        address _rewardsAssetManager,
        address _token,
        address[] memory _initialPCVDepositAddresses,
        uint128[] memory _initialPCVDepositWeights,
        uint128 _bufferWeight
    ) CoreRef(_core) {
        require(_initialPCVDepositAddresses.length == _initialPCVDepositWeights.length, "Addresses and weights are not the same length!");
        require(_rewardsAssetManager != address(0x0), "Rewards asset manager cannot be null");

        rewardsAssetManager = _rewardsAssetManager;
        token = _token;
        bufferWeight = _bufferWeight;
        totalWeight = bufferWeight;

        _setContractAdminRole(keccak256("PCV_CONTROLLER_ROLE"));

        for (uint256 i=0; i < _initialPCVDepositAddresses.length; i++) {
            _addPCVDeposit(_initialPCVDepositAddresses[i], _initialPCVDepositWeights[i]);
        }
    }

    // ---------- Public Functions -------------

    function rebalance() external virtual override whenNotPaused {
        _rebalance();
    }

    function rebalanceSingle(address pcvDeposit) external virtual override whenNotPaused {
        _rebalanceSingle(pcvDeposit);
    }

    /**
     * @notice deposits tokens into sub-contracts (if needed)
     * @dev this is equivalent to half of a rebalance. the implementation is as follows:
     * 1. fill the buffer to maximum
     * 2. if buffer is full and there are still tokens unallocated, calculate the optimal
     *    distribution of tokens to sub-contracts
     * 3. distribute the tokens according the calcluations in step 2
     */
    function deposit() external virtual override whenNotPaused {
        // First grab the aggregator balance & the pcv deposit balances, and the sum of the pcv deposit balances
        (uint256 actualAggregatorBalance, uint256 underlyingSum, uint[] memory underlyingBalances) = _getUnderlyingBalancesAndSum();
        uint256 totalBalance = underlyingSum + actualAggregatorBalance;

        // Optimal aggregator balance is (bufferWeight/totalWeight) * totalBalance
        uint256 optimalAggregatorBalance = bufferWeight * totalBalance / totalWeight;

        // if actual aggregator balance is below optimal, we shouldn't deposit to underlying - just "fill up the buffer"
        if (actualAggregatorBalance <= optimalAggregatorBalance) return;

        // we should fill up the buffer before sending out to sub-deposits
        uint256 amountAvailableForUnderlyingDeposits = optimalAggregatorBalance - actualAggregatorBalance;

        // calculate the amount that each pcv deposit needs. if they have an overage this is 0.
        uint[] memory optimalUnderlyingBalances = _getOptimalUnderlyingBalances(totalBalance);
        uint[] memory amountsNeeded = optimalUnderlyingBalances.positiveDifference(underlyingBalances);
        uint256 totalAmountNeeded = amountsNeeded.sum();

        // calculate a scalar. this will determine how much we *actually* send to each underlying deposit.
        uint256 scalar = amountAvailableForUnderlyingDeposits / totalAmountNeeded;

        for (uint256 i=0; i <underlyingBalances.length; i++) {
            // send scalar * the amount the underlying deposit needs
            uint256 amountToSend = scalar * amountsNeeded[i];
            if (amountToSend > 0) {
                _depositToUnderlying(pcvDepositAddresses.at(i), amountToSend);
            }
        }

        emit AggregatorDeposit();
    }

    /**
     * @notice withdraws the specified amount of tokens from the contract
     * @dev this is equivalent to half of a rebalance. the implementation is as follows:
     * 1. check if the contract has enough in the buffer to cover the withdrawal. if so, just use this
     * 2. if not, calculate what the ideal underlying amount should be for each pcv deposit *after* the withdraw
     * 3. then, cycle through them and withdraw until each has their ideal amount (for the ones that have overages)
     */
    function withdraw(address to, uint256 amount) external virtual override onlyPCVController whenNotPaused {
        uint256 aggregatorBalance = balance();

        if (aggregatorBalance > amount) {
            IERC20(token).safeTransfer(to, amount);
            return;
        }
        
        uint[] memory underlyingBalances = _getUnderlyingBalances();
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

    function withdrawERC20(address _token, address to, uint256 amount) external virtual override onlyPCVController {
        IERC20(_token).safeTransfer(to, amount);
    }

    function withdrawETH(address payable to, uint256 amount) external virtual override onlyPCVController {
        to.transfer(amount);
    }

    function setBufferWeight(uint256 newBufferWeight) external virtual override onlyGovernorOrAdmin {
        int256 difference = int(newBufferWeight) - int(bufferWeight);
        bufferWeight = uint(int(bufferWeight) + difference);

        totalWeight = uint(int(totalWeight) + difference);

        emit BufferWeightChanged(newBufferWeight);
    }

    function setPCVDepositWeight(address depositAddress, uint256 newDepositWeight) external virtual override onlyGovernorOrAdmin {
        require(pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        uint256 oldDepositWeight = pcvDepositWeights[depositAddress];
        int256 difference = int(newDepositWeight) - int(oldDepositWeight);
        pcvDepositWeights[depositAddress] = uint(newDepositWeight);

        totalWeight = uint(int(totalWeight) + difference);

        emit DepositWeightChanged(depositAddress, oldDepositWeight, newDepositWeight);
    }

    function removePCVDeposit(address pcvDeposit) external virtual override onlyGovernorOrAdmin {
        _removePCVDeposit(address(pcvDeposit));
    }

    function addPCVDeposit(address newPCVDeposit, uint256 weight) external virtual override onlyGovernorOrAdmin {
        _addPCVDeposit(address(newPCVDeposit), uint128(weight));
    }

    function setNewAggregator(address newAggregator) external virtual override onlyGovernor {
        require(PCVDepositAggregator(newAggregator).token() == token, "New aggregator must be for the same token as the existing.");

        // Add each pcvDeposit to the new aggregator
        for (uint256 i=0; i < pcvDepositAddresses.length(); i++) {
            if (IPCVDepositAggregator(newAggregator).hasPCVDeposit(pcvDepositAddresses.at(i))) continue;

            address pcvDepositAddress = pcvDepositAddresses.at(i);
            uint256 pcvDepositWeight = pcvDepositWeights[pcvDepositAddress];

            IPCVDepositAggregator(newAggregator).addPCVDeposit(pcvDepositAddress, pcvDepositWeight);
        }

        // Send old aggregator assets over to the new aggregator
        IERC20(token).safeTransfer(newAggregator, balance());

        // Call rebalance on the new aggregator
        IPCVDepositAggregator(newAggregator).rebalance();

        // No need to remove all deposits, this is a lot of extra gas.

        // Finally, set the new aggregator on the rewards asset manager itself
        IRewardsAssetManager(rewardsAssetManager).setNewAggregator(newAggregator);

        emit NewAggregatorSet(newAggregator);
    }

    // ---------- View Functions ---------------
    function hasPCVDeposit(address pcvDeposit) public view virtual override returns (bool) {
        return pcvDepositAddresses.contains(pcvDeposit);
    }

    function resistantBalanceAndFei() external view virtual override returns (uint256, uint256) {
        return (balance(), 0);
    }

    function balanceReportedIn() external view virtual override returns (address) {
        return token;
    }

    function balance() public view virtual override returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }

    function percentHeld(address pcvDeposit, uint256 depositAmount) external view virtual override returns(Decimal.D256 memory) {
        uint256 totalBalanceWithTheoreticalDeposit = getTotalBalance() + depositAmount;
        uint256 targetBalanceWithTheoreticalDeposit = IPCVDeposit(pcvDeposit).balance() + depositAmount;

        return Decimal.ratio(targetBalanceWithTheoreticalDeposit, totalBalanceWithTheoreticalDeposit);
    }

    function targetPercentHeld(address pcvDeposit) public view virtual override returns(Decimal.D256 memory) {
        return Decimal.ratio(pcvDepositWeights[pcvDeposit], totalWeight);
    }

    function amountFromTarget(address pcvDeposit) public view virtual override returns(int256) {
        uint256 totalBalance = getTotalBalance();

        uint256 pcvDepositBalance = IPCVDeposit(pcvDeposit).balance();
        uint256 pcvDepositWeight = pcvDepositWeights[address(pcvDeposit)];

        uint256 idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;
        
        return int(pcvDepositBalance) - int(idealDepositBalance);
    }

    function getAllAmountsFromTargets() public view virtual returns(int256[] memory distancesToTargets) {
        (uint256 aggregatorBalance, uint256 underlyingSum, uint[] memory underlyingBalances) = _getUnderlyingBalancesAndSum();
        uint256 totalBalance = aggregatorBalance + underlyingSum;

        distancesToTargets = new int[](pcvDepositAddresses.length());

        for (uint256 i=0; i < distancesToTargets.length; i++) {
            uint256 idealAmount = totalBalance * pcvDepositWeights[pcvDepositAddresses.at(i)] / totalWeight;
            distancesToTargets[i] = int(idealAmount) - int(underlyingBalances[i]);
        }

        return distancesToTargets;
    }

    function pcvDeposits() external view virtual override returns(address[] memory deposits, uint256[] memory weights) {
        deposits = new address[](pcvDepositAddresses.length());
        weights = new uint256[](pcvDepositAddresses.length());

        for (uint256 i=0; i < pcvDepositAddresses.length(); i++) {
            deposits[i] = pcvDepositAddresses.at(i);
            weights[i] = pcvDepositWeights[pcvDepositAddresses.at(i)];
        }

        return (deposits, weights);
    }

    function getTotalBalance() public view virtual override returns (uint256) {
        return _getUnderlyingBalances().sum() + balance();
    }

    function getTotalResistantBalanceAndFei() external view virtual override returns (uint256, uint256) {
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
    function _getUnderlyingBalancesAndSum() internal view returns (uint256 aggregatorBalance, uint256 depositSum, uint[] memory depositBalances) {
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        return (balance(), underlyingBalances.sum(), underlyingBalances);
    }

    function _depositToUnderlying(address to, uint256 amount) internal {
        IERC20(token).transfer(to, amount);
        IPCVDeposit(to).deposit();
    }

    function _getOptimalUnderlyingBalances(uint256 totalBalance) internal view returns (uint[] memory optimalUnderlyingBalances) {
        optimalUnderlyingBalances = new uint[](pcvDepositAddresses.length());

        for (uint256 i=0; i<optimalUnderlyingBalances.length; i++) {
            optimalUnderlyingBalances[i] = pcvDepositWeights[pcvDepositAddresses.at(i)] * totalBalance / totalWeight;
        }

        return optimalUnderlyingBalances;
    }

    function _getUnderlyingBalances() internal view returns (uint[] memory) {
        uint[] memory balances = new uint[](pcvDepositAddresses.length());

        for (uint256 i=0; i<pcvDepositAddresses.length(); i++) {
            balances[i] = IPCVDeposit(pcvDepositAddresses.at(i)).balance();
        }

        return balances;
    }

    function _rebalanceSingle(address pcvDeposit) internal {
        require(pcvDepositAddresses.contains(pcvDeposit), "Deposit does not exist.");

        int256 distanceToTarget = amountFromTarget(pcvDeposit);

        require(distanceToTarget != 0, "No rebalance needed.");

        if (distanceToTarget < 0 && balance() < uint(-1 * distanceToTarget)) {
            revert("Cannot rebalance this deposit, please rebalance another one first.");
        }

        // Now we know that we can rebalance either way
        if (distanceToTarget > 0) {
            // PCV deposit balance is too high. Withdraw from it into the aggregator.
            IPCVDeposit(pcvDeposit).withdraw(address(this), uint(distanceToTarget));
        } else {
            // PCV deposit balance is too low. Pull from the aggregator balance if we can.
            IERC20(token).safeTransfer(pcvDeposit, uint(-1 * distanceToTarget));
            IPCVDeposit(pcvDeposit).deposit();
        }

        emit RebalancedSingle(pcvDeposit);
    }

    function _rebalance() internal {
        (uint256 aggregatorBalance, uint256 totalUnderlyingBalance,) = _getUnderlyingBalancesAndSum();
        uint256 totalBalance = totalUnderlyingBalance + aggregatorBalance;

        // Grab the distance (and direction) each deposit is from its optimal balance
        // Remember, a positive distance means that the deposit has too much and a negative distance means it has too little
        int[] memory distancesToTargets = getAllAmountsFromTargets();

        // Do withdraws first
        for (uint256 i=0; i<distancesToTargets.length; i++) {
            if (distancesToTargets[i] < 0) {
                IPCVDeposit(pcvDepositAddresses.at(i)).withdraw(address(this), (-1 * distancesToTargets[i]).toUint256());
            }
        }

        // Do deposits next
        for (uint256 i=0; i<distancesToTargets.length; i++) {
            if (distancesToTargets[i] > 0) {
                IERC20(token).safeTransfer(pcvDepositAddresses.at(i), (distancesToTargets[i]).toUint256());
                IPCVDeposit(pcvDepositAddresses.at(i)).deposit();
            }
        }

        emit Rebalanced(totalBalance);
    }

    function _addPCVDeposit(address depositAddress, uint128 weight) internal {
        require(!pcvDepositAddresses.contains(depositAddress), "Deposit already added.");

        pcvDepositAddresses.add(depositAddress);
        pcvDepositWeights[depositAddress] = weight;

        totalWeight = totalWeight + weight;

        emit DepositAdded(depositAddress, weight);
    }

    function _removePCVDeposit(address depositAddress) internal {
        require(pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        // Short-circuit - if the pcv deposit's weight is already zero and the balance is zero, just remove it
        if (pcvDepositWeights[depositAddress] == 0 && IPCVDeposit(depositAddress).balance() == 0) {
            pcvDepositAddresses.remove(depositAddress);
            return;
        }

        // Set the PCV Deposit weight to 0 and rebalance to remove all of the liquidity from this particular deposit
        totalWeight = totalWeight - pcvDepositWeights[depositAddress];
        pcvDepositWeights[depositAddress] = 0;
        
        _rebalanceSingle(depositAddress);

        pcvDepositAddresses.remove(depositAddress);

        emit DepositRemoved(depositAddress);
    }
}