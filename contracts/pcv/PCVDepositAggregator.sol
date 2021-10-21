// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity ^0.8.4;

import "./IPCVDepositAggregator.sol";
import "./PCVDeposit.sol";
import "../refs/CoreRef.sol";
import "../external/Decimal.sol";
import "./balancer/IRewardsAssetManager.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import "@openzeppelin/contracts/utils/structs/EnumerableMap.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";
import "hardhat/console.sol";

contract PCVDepositAggregator is IPCVDepositAggregator, IPCVDeposit, CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;
    using SafeCast for uint256;
    using SafeCast for int256;

    // ---------- Events ----------

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

    function rebalance() external virtual override {
        _rebalance();
    }

    function rebalanceSingle(address pcvDeposit) external virtual override {
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
    function deposit() external virtual override {
        uint aggregatorBalance = IERC20(token).balanceOf(address(this));
        
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        
        uint totalUnderlyingBalance = _sumUnderlyingBalances(underlyingBalances);
        uint totalBalance = totalUnderlyingBalance + aggregatorBalance;
        uint optimalAggregatorBalance = bufferWeight * totalBalance / totalWeight;

        // if actual aggregator balance is below optimal, we shouldn't deposit to underlying - just "fill up the buffer"
        if (optimalAggregatorBalance >= aggregatorBalance) {
            return;
        }

        // we should fill up the buffer before sending out to sub-deposits
        uint amountAvailableForUnderlyingDeposits = optimalAggregatorBalance - aggregatorBalance;

        // calculate the amount that each pcv deposit needs. if they have an overage this is 0.
        uint[] memory optimalUnderlyingBalances = _getOptimalUnderlyingBalances(totalBalance);
        uint[] memory amountsNeeded = _computePositiveArrayDifference(optimalUnderlyingBalances, underlyingBalances);
        uint totalAmountNeeded = _sumArray(amountsNeeded);

        // calculate a scalar. this will determine how much we *actually* send to each underlying deposit.
        uint scalar = amountAvailableForUnderlyingDeposits / totalAmountNeeded;

        for (uint i=0; i <underlyingBalances.length; i++) {
            // send scalar * the amount the underlying deposit needs
            uint amountToSend = scalar * amountsNeeded[i];
            if (amountToSend > 0) {
                _depositToUnderlying(pcvDepositAddresses.at(i), amountToSend);
            }
        }
    }

    /**
     * @notice withdraws the specified amount of tokens from the contract
     * @dev this is equivalent to half of a rebalance. the implementation is as follows:
     * 1. check if the contract has enough in the buffer to cover the withdrawal. if so, just use this
     * 2. if not, calculate what the ideal underlying amount should be for each pcv deposit *after* the withdraw
     * 3. then, cycle through them and withdraw until each has their ideal amount (for the ones that have overages)
     */
    function withdraw(address to, uint256 amount) external virtual override onlyPCVController {
        uint aggregatorBalance = IERC20(token).balanceOf(address(this));

        if (aggregatorBalance > amount) {
            IERC20(token).safeTransfer(to, amount);
            return;
        }
        
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        uint totalUnderlyingBalance = _sumUnderlyingBalances(underlyingBalances);
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
    }

    function setPCVDepositWeight(address depositAddress, uint newDepositWeight) external virtual override onlyGovernorOrAdmin {
        require(!pcvDepositAddresses.contains(depositAddress), "Deposit does not exist.");

        int difference = int(newDepositWeight) - int(pcvDepositWeights[depositAddress]);
        pcvDepositWeights[depositAddress] = uint(newDepositWeight);

        totalWeight = uint(int(totalWeight) + difference);
    }

    function removePCVDeposit(address pcvDeposit) external virtual override onlyGovernorOrAdmin {
        _removePCVDeposit(address(pcvDeposit));
    }

    function addPCVDeposit(address newPCVDeposit, uint256 weight) external virtual override onlyGovernorOrAdmin {
        _addPCVDeposit(address(newPCVDeposit), uint128(weight));
    }

    function setNewAggregator(address newAggregator) external virtual override onlyGovernor {
        // Add each pcvDeposit to the new aggregator
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
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
    }

    // ---------- View Functions ---------------
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

    function targetPercentHeld(address pcvDeposit) external view virtual override returns(Decimal.D256 memory) {
        uint totalBalance = getTotalBalance();
        uint targetBalance = IPCVDeposit(pcvDeposit).balance();

        return Decimal.ratio(targetBalance, totalBalance);
    }

    function amountFromTarget(address pcvDeposit) external view virtual override returns(int256) {
        uint totalBalance = getTotalBalance();

        uint pcvDepositBalance = IPCVDeposit(pcvDeposit).balance();
        uint pcvDepositWeight = pcvDepositWeights[address(pcvDeposit)];

        uint idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;
        
        return int(idealDepositBalance) - int(pcvDepositBalance);
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
        uint totalBalance = 0;

        for (uint i=0; i<pcvDepositAddresses.length(); i++) {
            totalBalance += IPCVDeposit(pcvDepositAddresses.at(i)).balance();
        }

        // Let's not forget to get this balance
        totalBalance += balance();

        return totalBalance;
    }

    // ---------- Internal Functions ----------- //

    function _depositToUnderlying(address to, uint amount) internal {
        IERC20(token).transfer(to, amount);
        IPCVDeposit(to).deposit();
    }

    function _sumArray(uint256[] memory array) internal pure returns (uint256) {
        uint256 sum = 0;

        for (uint i=0; i < array.length; i++) {
            sum += array[i];
        }

        return sum;
    }

    function _computePositiveArrayDifference(uint[] memory a, uint[] memory b) internal pure returns (uint[] memory difference) {
        require(a.length == b.length,  "Arrays must be the same length");

        difference = new uint[](a.length);

        for (uint i=0; i < a.length; i++) {
            uint _a = a[i];
            uint _b = b[i];

            if (_a > _b) {
                difference[i] = _a - _b;
            }
        }

        return difference;
    }

    function _computeArrayDifference(uint[] memory a, uint[] memory b) internal pure returns (int[] memory difference) {
        require(a.length == b.length, "Arrays must be the same length");

        difference = new int[](a.length);

        for (uint i=0; i < a.length; i++) {
            difference[i] = int(a[i]) - int(b[i]);
        }

        return difference;
    }

    function _getOptimalUnderlyingBalances(uint totalBalance) internal view returns (uint[] memory optimalUnderlyingBalances) {
        optimalUnderlyingBalances = new uint[](pcvDepositAddresses.length());

        for (uint i=0; i<optimalUnderlyingBalances.length; i++) {
            optimalUnderlyingBalances[i] = pcvDepositWeights[pcvDepositAddresses.at(i)] * totalBalance / totalWeight;
        }

        return optimalUnderlyingBalances;
    }

    function _sumUnderlyingBalances(uint[] memory balances) internal pure returns (uint) {
        uint sum = 0;

        for (uint i=0; i<balances.length; i++) {
            sum += balances[i];
        }

        return sum;
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

        uint[] memory underlyingBalances = _getUnderlyingBalances();
        uint totalUnderlyingBalance = _sumUnderlyingBalances(underlyingBalances);
        uint aggregatorBalance = IERC20(token).balanceOf(address(this));
        uint totalBalance = totalUnderlyingBalance + aggregatorBalance;

        uint idealDepositBalance = pcvDepositWeights[pcvDeposit] * totalBalance / totalWeight;
        uint pcvDepositBalance = IPCVDeposit(pcvDeposit).balance();

        if (pcvDepositBalance > idealDepositBalance) {
            // PCV deposit balance is too high. Withdraw from it into the aggregator.
            IPCVDeposit(pcvDeposit).withdraw(address(this), pcvDepositBalance - idealDepositBalance);
        } else if (pcvDepositBalance < idealDepositBalance) {
            // PCV deposit balance is too low. Pull from the aggregator balance if we can.
            if (IERC20(token).balanceOf(address(this)) >= idealDepositBalance - pcvDepositBalance) {
                IERC20(token).safeTransfer(pcvDeposit, idealDepositBalance - pcvDepositBalance);
                IPCVDeposit(pcvDeposit).deposit();
            } else {
                // Emit event so that we know to do a full rebalance
            }
        } else {
            // PCV deposit balance is exactly where it needs to be. Don't touch it.
        }
    }

    function _rebalance() internal {
        // @todo don't put this on the stack
        uint[] memory underlyingBalances = _getUnderlyingBalances();
        uint totalUnderlyingBalance = _sumUnderlyingBalances(underlyingBalances);
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
    }

    function _addPCVDeposit(address depositAddress, uint128 weight) internal {
        require(pcvDepositAddresses.contains(depositAddress), "Deposit already added.");

        pcvDepositAddresses.add(depositAddress);
        pcvDepositWeights[depositAddress] = weight;

        totalWeight = totalWeight + weight;
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
    }
}