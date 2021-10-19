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

contract PCVDepositAggregator is IPCVDepositAggregator, CoreRef {
    using EnumerableSet for EnumerableSet.AddressSet;
    using SafeERC20 for IERC20;

    // ---------- Events ----------

    // ---------- Properties ------

    struct PCVDepositInfo {
        uint128 weight;
        bool depositsPaused;
    }

    EnumerableSet.AddressSet private pcvDepositAddresses;
    
    mapping(address => PCVDepositInfo) public pcvDepositInfos;
    
    uint128 public bufferWeight;
    uint128 public totalWeight; 
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
        if (_initialPCVDepositAddresses.length != _initialPCVDepositWeights.length) {
            revert("Addresses and weights are not the same length!");
        }

        if (_rewardsAssetManager == address(0x0)) {
            revert("Rewards asset manager cannot be null");
        }

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

    function deposit() external virtual override {
        // no-op
    }

    /**
     * @notice withdraws the specified amount of tokens from the contract
     * @dev the implementation is as follows:
     * 1. check if the contract has enough in the buffer to cover the withdrawal. if so, just use this
     * 2. if it doesn't, scan through each of the pcv deposits and withdraw from them their overage amounts,
     *    up to the total amount needed (less the amount already in the buffer)
     */
    function withdraw(address to, uint256 amount) external virtual override onlyPCVController {
        uint totalBalance = getTotalBalance();

        if (amount > totalBalance) {
            revert("Not enough balance to withdraw");
        }

        // If our buffer is full enough, just transfer from that
        if (IERC20(token).balanceOf(address(this)) >= amount) {
            IERC20(token).safeTransfer(to, amount);
        } else {
            // We're going to have to pull from underlying deposits
            // To avoid the need from a rebalance, we should only withdraw overages
            // Calculate the amounts to withdraw from each underlying (this is basically half of a rebalance)

            uint totalAmountNeeded = amount - IERC20(token).balanceOf(address(this));

            for (uint i=0; i < pcvDepositAddresses.length(); i++) {
                address pcvDepositAddress = pcvDepositAddresses.at(i);
                uint128 pcvDepositWeight = pcvDepositInfos[pcvDepositAddress].weight;
                uint actualPcvDepositBalance = IPCVDeposit(pcvDepositAddress).balance();
                uint idealPcvDepositBalance = pcvDepositWeight * totalBalance / totalWeight;

                // Only withdraw from this underlying if it has an overage 
                if (actualPcvDepositBalance > idealPcvDepositBalance) {
                    uint pcvDepositOverage = actualPcvDepositBalance - idealPcvDepositBalance;
                    uint amountToWithdraw = pcvDepositOverage;
                    
                    if (totalAmountNeeded < pcvDepositOverage) {
                        amountToWithdraw = totalAmountNeeded;
                    }
                    
                    IPCVDeposit(pcvDepositAddress).withdraw(address(this), amountToWithdraw);
                    totalAmountNeeded -= amountToWithdraw;

                    // If we don't need to withdraw anymore, stop looping over the deposits
                    if (totalAmountNeeded == 0) break;
                } else {
                    continue;
                }
            }

            IERC20(token).safeTransfer(to, amount);
        }
    }

    function withdrawERC20(address _token, address to, uint256 amount) external virtual override onlyPCVController {
        IERC20(_token).safeTransfer(to, amount);
    }

    function withdrawETH(address payable to, uint256 amount) external virtual override onlyPCVController {
        to.transfer(amount);
    }

    function setBufferWeight(uint128 newBufferWeight) external virtual override onlyGuardianOrGovernor {
        int128 difference = int128(newBufferWeight) - int128(bufferWeight);
        bufferWeight = uint128(int128(bufferWeight) + difference);

        totalWeight = uint128(int128(totalWeight) + difference);
    }

    function setPCVDepositWeight(address depositAddress, uint128 newDepositWeight) external virtual override onlyGuardianOrGovernor {
        if (!pcvDepositAddresses.contains(depositAddress)) {
            revert("Deposit does not exist.");
        }

        int128 difference = int128(newDepositWeight) - int128(pcvDepositInfos[depositAddress].weight);
        pcvDepositInfos[depositAddress].weight = uint128(newDepositWeight);

        totalWeight = uint128(int128(totalWeight) + difference);
    }

    function removePCVDeposit(address pcvDeposit) external virtual override onlyGuardianOrGovernor {
        _removePCVDeposit(address(pcvDeposit));
    }

    function addPCVDeposit(address newPCVDeposit, uint256 weight) external virtual override onlyGovernor {
        _addPCVDeposit(address(newPCVDeposit), uint128(weight));
    }

    function setNewAggregator(address newAggregator) external virtual override onlyGovernor {
        // Add each pcvDeposit to the new aggregator
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            address pcvDepositAddress = pcvDepositAddresses.at(i);
            uint128 pcvDepositWeight = pcvDepositInfos[pcvDepositAddress].weight;

            IPCVDepositAggregator(newAggregator).addPCVDeposit(pcvDepositAddress, pcvDepositWeight);
        }

        // Set all weights to zero (except for us)
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            address pcvDepositAddress = pcvDepositAddresses.at(i);
            pcvDepositInfos[pcvDepositAddress].weight = uint128(0);
        }

        // Rebalance (withdraws everything to us)
        _rebalance();

        // Send everything over to the new aggregator
        IERC20(token).safeTransfer(address(newAggregator), IERC20(token).balanceOf(address(this)));

        // Call rebalance on the new aggregator
        IPCVDepositAggregator(newAggregator).rebalance();

        // Remove all deposits.
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            address pcvDepositAddress = pcvDepositAddresses.at(i);
            _removePCVDeposit(pcvDepositAddress);
        }

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
        return getTotalBalance();
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
        uint pcvDepositWeight = pcvDepositInfos[address(pcvDeposit)].weight;

        uint idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;
        
        return int(idealDepositBalance) - int(pcvDepositBalance);
    }

    function pcvDeposits() external view virtual override returns(address[] memory deposits, uint256[] memory weights) {
        address[] memory _deposits = new address[](pcvDepositAddresses.length());
        uint256[] memory _weights = new uint256[](pcvDepositAddresses.length());

        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            _deposits[i] = pcvDepositAddresses.at(i);
            _weights[i] = pcvDepositInfos[pcvDepositAddresses.at(i)].weight;
        }

        return (_deposits, _weights);
    }

    function getTotalBalance() public view virtual override returns (uint256) {
        uint totalBalance = 0;

        for (uint i=0; i<pcvDepositAddresses.length(); i++) {
            totalBalance += IPCVDeposit(pcvDepositAddresses.at(i)).balance();
        }

        // Let's not forget to get this balance
        totalBalance += IERC20(token).balanceOf(address(this));

        return totalBalance;
    }

    // ---------- Internal Functions ----------- //

    function _rebalanceSingle(address pcvDeposit) internal {
        if (!pcvDepositAddresses.contains(pcvDeposit)) {
            revert("Deposit does not exist.");
        }

        uint totalBalance = getTotalBalance();
        uint128 pcvDepositWeight = pcvDepositInfos[pcvDeposit].weight;
        uint idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;
        uint pcvDepositBalance = IPCVDeposit(pcvDeposit).balance();

        if (pcvDepositBalance > idealDepositBalance) {
            // PCV deposit balance is too high. Withdraw from it into the aggregator.
            uint overage = pcvDepositBalance - idealDepositBalance;
            IPCVDeposit(pcvDeposit).withdraw(address(this), overage);
        } else if (pcvDepositBalance < idealDepositBalance) {
            // PCV deposit balance is too low. Pull from the aggregator balance if we can.
            uint defecit = idealDepositBalance - pcvDepositBalance;
            if (IERC20(token).balanceOf(address(this)) >= defecit) {
                IERC20(token).safeTransfer(pcvDeposit, defecit);
                IPCVDeposit(pcvDeposit).deposit();
            } else {
                // Emit event so that we know to do a full rebalance
            }
        } else {
            // PCV deposit balance is exactly where it needs to be. Don't touch it.
        }
    }


    function _rebalance() internal {
        // Get the balances of all pcvDepositInfos

        uint totalBalance = getTotalBalance();

        uint[] memory depositAmountsNeeded = new uint[](pcvDepositAddresses.length());

        for (uint i=0; i<pcvDepositAddresses.length(); i++) {
            address pcvDepositAddress = pcvDepositAddresses.at(i);
            uint pcvDepositBalance = IPCVDeposit(pcvDepositAddress).balance();
            uint pcvDepositWeight = pcvDepositInfos[pcvDepositAddress].weight;

            uint idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;

            if (pcvDepositBalance > idealDepositBalance) {
                // Has an overage. Let's take it.
                uint overage = pcvDepositBalance - idealDepositBalance;
                IPCVDeposit(pcvDepositAddress).withdraw(address(this), overage);
            } else if (pcvDepositBalance < idealDepositBalance) {
                // Needs a deposit. Let's write that down.
                uint needed = idealDepositBalance - pcvDepositBalance;
                depositAmountsNeeded[i] = needed;
            } else {
                // Do nothing
                // This accounts for the rare = case, but is definitely necessary.
            }
        }

        for (uint i=0; i<depositAmountsNeeded.length; i++) {
            uint amountNeeded = depositAmountsNeeded[i];
            if (amountNeeded == 0) continue;

            address depositAddress = pcvDepositAddresses.at(i);

            IERC20(token).safeTransfer(depositAddress, amountNeeded);
            IPCVDeposit(depositAddress).deposit();
        }
    }

    function _addPCVDeposit(address depositAddress, uint128 weight) internal {
        if (pcvDepositAddresses.contains(depositAddress)) {
            revert("Deposit already added.");
        }

        pcvDepositAddresses.add(depositAddress);
        pcvDepositInfos[depositAddress] = PCVDepositInfo(
            weight,
            false
        );

        totalWeight = totalWeight + weight;
    }
    function _removePCVDeposit(address depositAddress) internal {
        if (!pcvDepositAddresses.contains(depositAddress)) {
            revert("Deposit does not exist.");
        }

        // Short-circuit - if the pcv deposit's weight is already zero and the balance is zero, just delete it
        if (pcvDepositInfos[depositAddress].weight == 0 && IPCVDeposit(depositAddress).balance() == 0) {
            delete pcvDepositInfos[depositAddress];
            pcvDepositAddresses.remove(depositAddress);
            return;
        }

        // Set the PCV Deposit weight to 0 and rebalance to remove all of the liquidity from this particular deposit
        totalWeight = totalWeight - pcvDepositInfos[depositAddress].weight;
        pcvDepositInfos[depositAddress].weight = 0;
        
        _rebalance();

        delete pcvDepositInfos[depositAddress];
        pcvDepositAddresses.remove(depositAddress);
    }
}