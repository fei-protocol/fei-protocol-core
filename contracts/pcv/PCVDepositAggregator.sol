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
    function sum(uint[] memory array) internal pure returns (uint _sum) {
        for (uint i=0; i < array.length; i++) {
            _sum += array[i];
        }

        return _sum;
    }

    function difference(uint[] memory a, uint[] memory b) internal pure returns (int[] memory _difference) {
        require(a.length == b.length, "Arrays must be the same length");

        _difference = new int[](a.length);

        for (uint i=0; i < a.length; i++) {
            _difference[i] = int(a[i]) - int(b[i]);
        }

        return _difference;
    }

    function positiveDifference(uint[] memory a, uint[] memory b) internal pure returns (uint[] memory _positiveDifference) {
        require(a.length == b.length,  "Arrays must be the same length");

        _positiveDifference = new uint[](a.length);

        for (uint i=0; i < a.length; i++) {
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
    
    uint public bufferWeight;
    uint public totalWeight; 

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
        require(_initialPCVDepositAddresses.length != _initialPCVDepositWeights.length, "Addresses and weights are not the same length!");
        require(_rewardsAssetManager == address(0x0), "Rewards asset manager cannot be null");

        rewardsAssetManager = _rewardsAssetManager;
        token = _token;
        bufferWeight = _bufferWeight;
        totalWeight = bufferWeight;

        _setContractAdminRole(keccak256("PCV_CONTROLLER_ROLE"));

        for (uint i=0; i < _initialPCVDepositAddresses.length; i++) {
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
        (uint actualAggregatorBalance, uint underlyingSum, uint[] memory underlyingBalances) = _getUnderlyingBalancesAndSum();
        uint totalBalance = underlyingSum + actualAggregatorBalance;

        // Optimal aggregator balance is (bufferWeight/totalWeight) * totalBalance
        uint optimalAggregatorBalance = bufferWeight * totalBalance / totalWeight;

        // if actual aggregator balance is below optimal, we shouldn't deposit to underlying - just "fill up the buffer"
        if (actualAggregatorBalance <= optimalAggregatorBalance) return;

        // we should fill up the buffer before sending out to sub-deposits
        uint amountAvailableForUnderlyingDeposits = optimalAggregatorBalance - actualAggregatorBalance;

        // calculate the amount that each pcv deposit needs. if they have an overage this is 0.
        uint[] memory optimalUnderlyingBalances = _getOptimalUnderlyingBalances(totalBalance);
        uint[] memory amountsNeeded = optimalUnderlyingBalances.positiveDifference(underlyingBalances);
        uint totalAmountNeeded = amountsNeeded.sum();

        // calculate a scalar. this will determine how much we *actually* send to each underlying deposit.
        uint scalar = amountAvailableForUnderlyingDeposits / totalAmountNeeded;

        for (uint i=0; i <underlyingBalances.length; i++) {
            // send scalar * the amount the underlying deposit needs
            uint amountToSend = scalar * amountsNeeded[i];
            if (amountToSend > 0) {
                _depositToUnderlying(pcvDepositAddresses.at(i), amountToSend);
            }
        }

        emit Deposit();
    }

    /**
     * @notice withdraws the specified amount of tokens from the contract
     * @dev this is equivalent to half of a rebalance. the implementation is as follows:
     * 1. check if the contract has enough in the buffer to cover the withdrawal. if so, just use this
     * 2. if not, calculate what the ideal underlying amount should be for each pcv deposit *after* the withdraw
     * 3. then, cycle through them and withdraw until each has their ideal amount (for the ones that have overages)
     */
    function withdraw(address to, uint256 amount) external virtual override onlyPCVController whenNotPaused {
        uint aggregatorBalance = balance();

        if (aggregatorBalance > amount) {
            IERC20(token).safeTransfer(to, amount);
            return;
        }
        
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        uint totalUnderlyingBalance = underlyingBalances.sum();
        uint totalBalance = totalUnderlyingBalance + aggregatorBalance;

        require(totalBalance >= amount, "Not enough balance to withdraw");

        // We're going to have to pull from underlying deposits
        // To avoid the need from a rebalance, we should withdraw proportionally from each deposit
        // such that at the end of this loop, each deposit has moved towards a correct weighting
        uint amountNeededFromUnderlying = amount - aggregatorBalance;
        uint totalUnderlyingBalanceAfterWithdraw = totalUnderlyingBalance - amountNeededFromUnderlying;

        // Next, calculate exactly the desired underlying balance after withdraw
        uint[] memory idealUnderlyingBalancesPostWithdraw = new uint[](pcvDepositAddresses.length());
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            idealUnderlyingBalancesPostWithdraw[i] = totalUnderlyingBalanceAfterWithdraw * pcvDepositWeights[pcvDepositAddresses.at(i)] / totalWeight;
        }

        // This basically does half of a rebalance.
        // (pulls from the deposits that have > than their post-withdraw-ideal-underlying-balance)
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            address pcvDepositAddress = pcvDepositAddresses.at(i);
            uint actualPcvDepositBalance = underlyingBalances[i];
            uint idealPcvDepositBalance = idealUnderlyingBalancesPostWithdraw[i];

            // @todo collapse this logic
            if (idealPcvDepositBalance >= actualPcvDepositBalance) {
                continue;
            } else {
                // Has post-withdraw-overage; let's take it
                uint amountToWithdraw = actualPcvDepositBalance - idealPcvDepositBalance;
                IPCVDeposit(pcvDepositAddress).withdraw(address(this), amountToWithdraw);
            }
        }

        IERC20(token).safeTransfer(to, amount);

        emit Withdrawal(amount);
    }

    function withdrawERC20(address _token, address to, uint256 amount) external virtual override onlyPCVController {
        IERC20(_token).safeTransfer(to, amount);
    }

    function withdrawETH(address payable to, uint256 amount) external virtual override onlyPCVController {
        to.transfer(amount);
    }

    function setBufferWeight(uint newBufferWeight) external virtual override onlyGovernorOrAdmin {
        int difference = int(newBufferWeight) - int(bufferWeight);
        bufferWeight = uint(int(bufferWeight) + difference);

        totalWeight = uint(int(totalWeight) + difference);

        emit BufferWeightChanged(newBufferWeight);
    }

    function setPCVDepositWeight(address depositAddress, uint newDepositWeight) external virtual override onlyGovernorOrAdmin {
        require(!pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        uint oldDepositWeight = pcvDepositWeights[depositAddress];
        int difference = int(newDepositWeight) - int(oldDepositWeight);
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
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            if (IPCVDepositAggregator(newAggregator).hasPCVDeposit(pcvDepositAddresses.at(i))) continue;

            address pcvDepositAddress = pcvDepositAddresses.at(i);
            uint pcvDepositWeight = pcvDepositWeights[pcvDepositAddress];

            IPCVDepositAggregator(newAggregator).addPCVDeposit(pcvDepositAddress, pcvDepositWeight);
        }

        // Send old aggregator assets over to the new aggregator
        IERC20(token).safeTransfer(address(newAggregator), IERC20(token).balanceOf(address(this)));

        // Call rebalance on the new aggregator
        IPCVDepositAggregator(newAggregator).rebalance();

        // No need to remove all deposits, this is a lot of extra gas.

        // Finally, set the new aggregator on the rewards asset manager itself
        IRewardsAssetManager(rewardsAssetManager).setNewAggregator(address(newAggregator));

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
        uint totalBalanceWithTheoreticalDeposit = getTotalBalance() + depositAmount;
        uint targetBalanceWithTheoreticalDeposit = IPCVDeposit(pcvDeposit).balance() + depositAmount;

        return Decimal.ratio(targetBalanceWithTheoreticalDeposit, totalBalanceWithTheoreticalDeposit);
    }

    function targetPercentHeld(address pcvDeposit) public view virtual override returns(Decimal.D256 memory) {
        return Decimal.ratio(pcvDepositWeights[pcvDeposit], totalWeight);
    }

    function amountFromTarget(address pcvDeposit) public view virtual override returns(int256) {
        uint totalBalance = getTotalBalance();

        uint pcvDepositBalance = IPCVDeposit(pcvDeposit).balance();
        uint pcvDepositWeight = pcvDepositWeights[address(pcvDeposit)];

        uint idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;
        
        return int(pcvDepositBalance) - int(idealDepositBalance);
    }

    function pcvDeposits() external view virtual override returns(address[] memory deposits, uint256[] memory weights) {
        deposits = new address[](pcvDepositAddresses.length());
        weights = new uint256[](pcvDepositAddresses.length());

        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            deposits[i] = pcvDepositAddresses.at(i);
            weights[i] = pcvDepositWeights[pcvDepositAddresses.at(i)];
        }

        return (deposits, weights);
    }

    function getTotalBalance() public view virtual override returns (uint256) {
        return _getUnderlyingBalances().sum() + balance();
    }

    function getTotalResistantBalanceAndFei() external view virtual override returns (uint256, uint256) {
        uint totalResistantBalance = 0;
        uint totalResistantFei = 0;

        for (uint i=0; i<pcvDepositAddresses.length(); i++) {
            (uint resistantBalance, uint resistantFei) = IPCVDeposit(pcvDepositAddresses.at(i)).resistantBalanceAndFei();

            totalResistantBalance += resistantBalance;
            totalResistantFei += resistantFei;
        }

        // Let's not forget to get this balance
        totalResistantBalance += balance();

        // There's no Fei to add

        return (totalResistantBalance, totalResistantFei);
    }

    // ---------- Internal Functions ----------- //
    function _getUnderlyingBalancesAndSum() internal view returns (uint aggregatorBalance, uint depositSum, uint[] memory depositBalances) {
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        return (balance(), underlyingBalances.sum(), underlyingBalances);
    }

    function _depositToUnderlying(address to, uint amount) internal {
        IERC20(token).transfer(to, amount);
        IPCVDeposit(to).deposit();
    }

    function _getOptimalUnderlyingBalances(uint totalBalance) internal view returns (uint[] memory optimalUnderlyingBalances) {
        optimalUnderlyingBalances = new uint[](pcvDepositAddresses.length());

        for (uint i=0; i<optimalUnderlyingBalances.length; i++) {
            optimalUnderlyingBalances[i] = pcvDepositWeights[pcvDepositAddresses.at(i)] * totalBalance / totalWeight;
        }

        return optimalUnderlyingBalances;
    }

    function _getUnderlyingBalances() internal view returns (uint[] memory) {
        uint[] memory balances = new uint[](pcvDepositAddresses.length());

        for (uint i=0; i<pcvDepositAddresses.length(); i++) {
            balances[i] = IPCVDeposit(pcvDepositAddresses.at(i)).balance();
        }

        return balances;
    }

    function _rebalanceSingle(address pcvDeposit) internal {
        require(!pcvDepositAddresses.contains(pcvDeposit), "Deposit does not exist.");

        int distanceToTarget = amountFromTarget(pcvDeposit);

        if (distanceToTarget == 0) {
            // do nothing
        } else if (distanceToTarget > 0) {
            // PCV deposit balance is too high. Withdraw from it into the aggregator.
            IPCVDeposit(pcvDeposit).withdraw(address(this), uint(distanceToTarget));
            emit RebalancedSingle(pcvDeposit);
        } else if (distanceToTarget < 0) {
            // PCV deposit balance is too low. Pull from the aggregator balance if we can.
            if (balance() >= uint(-distanceToTarget)) {
                IERC20(token).safeTransfer(pcvDeposit, uint(-distanceToTarget));
                IPCVDeposit(pcvDeposit).deposit();
                emit RebalancedSingle(pcvDeposit);
            } else {
                emit CannotRebalanceSingle(pcvDeposit, uint(-distanceToTarget), balance());
            }
        } else {
            // PCV deposit balance is exactly where it needs to be. Don't touch it.
            emit NoRebalanceNeeded(pcvDeposit);
        }
    }

    function _rebalance() internal {
        // @todo don't put this on the stack
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        uint totalUnderlyingBalance = underlyingBalances.sum();
        uint aggregatorBalance = IERC20(token).balanceOf(address(this));
        uint totalBalance = totalUnderlyingBalance + aggregatorBalance;

        // Calculate exactly the desired underlying balance
        int[] memory amountsNeeded = new int[](pcvDepositAddresses.length());
        for (uint i=0; i < amountsNeeded.length; i++) {
            uint idealAmount = totalBalance * pcvDepositWeights[pcvDepositAddresses.at(i)] / totalWeight;
            amountsNeeded[i] = int(idealAmount) - int(underlyingBalances[i]);
        }

        // Do withdraws first
        for (uint i=0; i<amountsNeeded.length; i++) {
            if (amountsNeeded[i] < 0) {
                IPCVDeposit(pcvDepositAddresses.at(i)).withdraw(address(this), (-amountsNeeded[i]).toUint256());
            }
        }

        // Do deposits next
        for (uint i=0; i<amountsNeeded.length; i++) {
            if (amountsNeeded[i] > 0) {
                IERC20(token).safeTransfer(pcvDepositAddresses.at(i), (amountsNeeded[i]).toUint256());
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
        require(!pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        // Short-circuit - if the pcv deposit's weight is already zero and the balance is zero, just delete it
        if (pcvDepositWeights[depositAddress] == 0 && IPCVDeposit(depositAddress).balance() == 0) {
            delete pcvDepositWeights[depositAddress];
            pcvDepositAddresses.remove(depositAddress);
            return;
        }

        // Set the PCV Deposit weight to 0 and rebalance to remove all of the liquidity from this particular deposit
        totalWeight = totalWeight - pcvDepositWeights[depositAddress];
        pcvDepositWeights[depositAddress] = 0;
        
        _rebalance();

        delete pcvDepositWeights[depositAddress];
        pcvDepositAddresses.remove(depositAddress);

        emit DepositRemvoed(depositAddress);
    }
}