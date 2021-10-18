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
    uint128 bufferWeight;
    uint128 totalWeight; 
    address token;

    constructor(
        address _core,
        address[] memory _initialPCVDepositAddresses,
        uint128[] memory _initialPCVDepositWeights,
        uint128 reserveWeight
    ) CoreRef(_core) {
        if (_initialPCVDepositAddresses.length != _initialPCVDepositWeights.length) {
            revert("Addresses and weights are not the same length!");
        }

        _setContractAdminRole(keccak256("PCV_CONTROLLER_ROLE"));

        for (uint i=0; i < _initialPCVDepositAddresses.length; i++) {
            _addPCVDeposit(_initialPCVDepositAddresses[i], _initialPCVDepositWeights[i]);
        }
    }

    // ---------- Public Functions -------------

    function rebalance() external {
        revert("Function not yet implemented.");
    }

    function deposit() external {
        revert("Function not yet implemented.");
    }

    function withdraw(address to, uint256 amount) external onlyPCVController {
        revert("Function not yet implemented.");
    }

    function withdrawERC20(address token, address to, uint256 amount) external onlyPCVController {
        revert("Function not yet implemented.");
    }

    function withdrawETH(address payable to, uint256 amount) external onlyPCVController {
        revert("Function not yet implemented.");
    }

    function removePCVDeposit(IPCVDeposit pcvDeposit) external onlyGuardianOrGovernor {
        revert("Function not yet implemented.");
    }

    function addPCVDeposit(IPCVDeposit newPCVDeposit, uint256 weight) external onlyGovernor {
        revert("Function not yet implemented.");
    }

    function setNewAggregator(IPCVDepositAggregator newAggregator) external onlyGovernor {
        revert("Function not yet implemented.");
    }

    // ---------- View Functions ---------------
    function resistantBalanceAndFei() external view returns (uint256, uint256) {
        revert("Function not yet implemented.");
    }

    function balanceReportedIn() external view returns (address) {
        revert("Function not yet implemented.");
    }

    function balance() public view virtual returns (uint256) {
        revert("Function not yet implemented.");
    }

    function percentHeld(IPCVDeposit pcvDeposit, uint256 depositAmount) external view returns(Decimal.D256 memory) {
        revert("Function not yet implemented.");
    }

    function targetPercentHeld(IPCVDeposit pcvDeposit) external view returns(Decimal.D256 memory) {
        revert("Function not yet implemented.");
    }

    function amountFromTarget(IPCVDeposit pcvDeposit) external view returns(int256) {
        revert("Function not yet implemented.");
    }

    function pcvDeposits() external view returns(IPCVDeposit[] memory deposits, uint256[] memory weights) {
        revert("Function not yet implemented.");
    }

    function rewardsAssetManager() external returns (address) {
        revert("Function not yet implemented.");
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

        pcvDepositInfos
[depositAddress] = PCVDepositInfo(
            weight,
            false
        );

        totalWeight = totalWeight + weight;
    }
    function _removePCVDeposit(address depositAddress) internal {
        if (!pcvDepositAddresses.contains(depositAddress)) {
            revert("Deposit does not exist.");
        }

        // Set the PCV Deposit weight to 0 and rebalance to remove all of the liquidity from this particular deposit
        totalWeight = totalWeight - pcvDepositInfos
[depositAddress].weight;
        pcvDepositInfos
[depositAddress].weight = 0;
        
        _rebalance();

        delete pcvDepositInfos
[depositAddress];
    }
}