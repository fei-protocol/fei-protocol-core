// SPDX-License-Identifier: GPL-3.0-or-later
pragma solidity 0.8.9;

import "./IPCVDepositAggregator.sol";
import "./PCVDeposit.sol";
import "../refs/CoreRef.sol";
import "../external/Decimal.sol";
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
    address public rewardsAssetManager;

    constructor(
        address _core,
        address _rewardsAssetManager,
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
        bufferWeight = _bufferWeight;

        _setContractAdminRole(keccak256("PCV_CONTROLLER_ROLE"));

        for (uint i=0; i < _initialPCVDepositAddresses.length; i++) {
            _addPCVDeposit(_initialPCVDepositAddresses[i], _initialPCVDepositWeights[i]);
        }
    }

    // ---------- Public Functions -------------

    function rebalance() external {
        _rebalance();
    }

    function deposit() external {
        // no-op
        // emit event?
    }

    function withdraw(address to, uint256 amount) external onlyPCVController {
        uint totalBalance = getTotalBalance();

        if (amount > totalBalance) {
            revert("Not enough balance to withdraw");
        }

        if (IERC20(token).balanceOf(address(this)) >= amount) {
            IERC20(token).safeTransfer(to, amount);
        } else {
            // We're going to have to pull from underlying deposits
            // To avoid the need from a rebalance, we should only withdraw overages
            // Calculate the amounts to withdraw from each underlying (this is basically a rebalance)

            uint totalAmountNeeded = amount - IERC20(token).balanceOf(address(this));

            for (uint i=0; i < pcvDepositAddresses.length(); i++) {
                address pcvDepositAddress = pcvDepositAddresses.at(i);
                uint128 pcvDepositWeight = pcvDepositInfos[pcvDepositAddress].weight;
                uint actualPcvDepositBalance = IPCVDeposit(pcvDepositAddress).balance();
                uint idealPcvDepositBalance = pcvDepositWeight * totalBalance / totalWeight;

                if (actualPcvDepositBalance > idealPcvDepositBalance) {
                    uint pcvDepositOverage = actualPcvDepositBalance - idealPcvDepositBalance;
                    uint amountToWithdraw = totalAmountNeeded;
                    
                    if (amountToWithdraw > pcvDepositOverage) {
                        amountToWithdraw = pcvDepositOverage;
                    }
                    
                    IPCVDeposit(pcvDepositAddress).withdraw(address(this), amountToWithdraw);
                    totalAmountNeeded -= amountToWithdraw;

                    if (totalAmountNeeded == 0) break;
                } else {
                    continue;
                }
            }

            IERC20(token).safeTransfer(to, amount);
        }
    }

    function withdrawERC20(address _token, address to, uint256 amount) external onlyPCVController {
        IERC20(_token).safeTransfer(to, amount);
    }

    function withdrawETH(address payable to, uint256 amount) external onlyPCVController {
        to.transfer(amount);
    }

    function setPCVDepositWeight(address depositAddress, uint weight) external onlyGuardianOrGovernor {
        if (!pcvDepositAddresses.contains(depositAddress)) {
            revert("Deposit does not exist.");
        }

        pcvDepositInfos[depositAddress].weight = uint128(weight);
    }

    function removePCVDeposit(IPCVDeposit pcvDeposit) external onlyGuardianOrGovernor {
        _removePCVDeposit(address(pcvDeposit));
    }

    function addPCVDeposit(IPCVDeposit newPCVDeposit, uint256 weight) external onlyGovernor {
        _addPCVDeposit(address(newPCVDeposit), uint128(weight));
    }

    function setNewAggregator(IPCVDepositAggregator newAggregator) external onlyGovernor {
        // Add each pcvDeposit to the new aggregator
        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            address pcvDepositAddress = pcvDepositAddresses.at(i);
            uint128 pcvDepositWeight = pcvDepositInfos[pcvDepositAddress].weight;

            IPCVDepositAggregator(newAggregator).addPCVDeposit(IPCVDeposit(pcvDepositAddress), pcvDepositWeight);
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
    }

    // ---------- View Functions ---------------
    function resistantBalanceAndFei() external view returns (uint256, uint256) {
        return (balance(), 0);
    }

    function balanceReportedIn() external view returns (address) {
        return token;
    }

    function balance() public view virtual returns (uint256) {
        return getTotalBalance();
    }

    function percentHeld(IPCVDeposit pcvDeposit, uint256 depositAmount) external view returns(Decimal.D256 memory) {
        uint totalBalanceWithTheoreticalDeposit = getTotalBalance() + depositAmount;

        uint targetBalanceWithTheoreticalDeposit = pcvDeposit.balance() + depositAmount;

        return Decimal.ratio(targetBalanceWithTheoreticalDeposit, totalBalanceWithTheoreticalDeposit);
    }

    function targetPercentHeld(IPCVDeposit pcvDeposit) external view returns(Decimal.D256 memory) {
        uint totalBalance = getTotalBalance();
        uint targetBalance = pcvDeposit.balance();

        return Decimal.ratio(targetBalance, totalBalance);
    }

    function amountFromTarget(IPCVDeposit pcvDeposit) external view returns(int256) {
        uint totalBalance = getTotalBalance();

        uint pcvDepositBalance = pcvDeposit.balance();
        uint pcvDepositWeight = pcvDepositInfos[address(pcvDeposit)].weight;

        uint idealDepositBalance = pcvDepositWeight * totalBalance / totalWeight;
        
        return int(pcvDepositBalance) - int(idealDepositBalance);
    }

    function pcvDeposits() external view returns(IPCVDeposit[] memory deposits, uint256[] memory weights) {
        IPCVDeposit[] memory _deposits = new IPCVDeposit[](pcvDepositAddresses.length());
        uint256[] memory _weights = new uint256[](pcvDepositAddresses.length());

        for (uint i=0; i < pcvDepositAddresses.length(); i++) {
            deposits[i] = IPCVDeposit(pcvDepositAddresses.at(i));
            weights[i] = pcvDepositInfos[pcvDepositAddresses.at(i)].weight;
        }

        return (_deposits, _weights);
    }

    function getTotalBalance() public view virtual returns (uint256) {
        uint totalBalance = 0;

        for (uint i=0; i<pcvDepositAddresses.length(); i++) {
            totalBalance += IPCVDeposit(pcvDepositAddresses.at(i)).balance();
        }

        // Let's not forget to get this balance
        totalBalance += IERC20(token).balanceOf(address(this));

        return totalBalance;
    }

    // ---------- Internal Functions -----------

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
                depositAmountsNeeded[i] = idealDepositBalance - pcvDepositBalance;
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