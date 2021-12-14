pragma solidity ^0.8.4;

import "../IPCVDepositBalances.sol";
import "../../Constants.sol";
import "../../refs/CoreRef.sol";
import "@openzeppelin/contracts/utils/math/SafeCast.sol";

/**
  @notice a contract to report static PCV data to cover PCV not held with a reliable oracle or on-chain reading 
  @author Fei Protocol

  Returns PCV in USD terms
*/
contract NamedStaticPCVDepositWrapper is IPCVDepositBalances, CoreRef {
    using SafeCast for *;

    // -------------- Events ---------------
    event BalanceUpdate(uint256 oldBalance, uint256 newBalance, uint256 oldFEIBalance, uint256 newFEIBalance);

    event DepositRemoved(uint256 index);

    /// @notice struct to store info on each PCV Deposit
    struct PCVDeposit {
        string depositName;
        uint256 usdAmount; /// USD equivalent in this deposit, not including FEI value
        uint256 feiAmount; /// amount of FEI in this deposit
        uint256 underlyingTokenAmount; /// amount of underlying token in this deposit
        address underlying; /// address of the underlying token this deposit is reporting
    }

    /// @notice a list of all pcv deposits
    PCVDeposit[] public pcvDeposits;

    /// @notice the PCV balance
    uint256 public override balance;

    /// @notice the reported FEI balance
    uint256 public feiReportBalance;

    constructor(address _core, PCVDeposit[] memory newPCVDeposits) CoreRef(_core) {

        // Uses oracle admin to share admin with CR oracle where this contract is used
        _setContractAdminRole(keccak256("ORACLE_ADMIN_ROLE"));

        // add all pcv deposits
        for (uint256 i = 0; i < newPCVDeposits.length; i++) {
            _addDeposit(newPCVDeposits[i]);
        }
    }

    /// @notice helper method to delete a PCV deposit
    function _removeDeposit(uint256 index) internal {
        PCVDeposit storage removePCVDeposit = pcvDeposits[index];

        uint256 depositBalance = removePCVDeposit.usdAmount;
        uint256 feiDepositBalance = removePCVDeposit.feiAmount;

        balance -= depositBalance;
        feiReportBalance -= feiDepositBalance;
        delete pcvDeposits[index];

        emit BalanceUpdate(balance + depositBalance, balance, feiReportBalance + feiDepositBalance, feiReportBalance);
        emit DepositRemoved(index);
    }

    /// @notice helper method to add a PCV deposit
    function _addDeposit(PCVDeposit memory newPCVDeposit) internal {
        require(newPCVDeposit.feiAmount > 0 || newPCVDeposit.usdAmount > 0, "NamedStaticPCVDepositWrapper: must supply either fei or usd amount");

        uint256 oldBalance = balance;
        uint256 oldFEIBalance = feiReportBalance;

        balance += newPCVDeposit.usdAmount;
        feiReportBalance += newPCVDeposit.feiAmount;
        pcvDeposits.push(newPCVDeposit);

        emit BalanceUpdate(oldBalance, balance, oldFEIBalance, feiReportBalance);
    }

    /// @notice helper method to edit a PCV deposit
    function _editDeposit(
        uint256 index,
        uint256 usdAmount,
        uint256 feiAmount,
        uint256 underlyingTokenAmount,
        string calldata depositName,
        address underlying
    ) internal {
        PCVDeposit storage updatePCVDeposit = pcvDeposits[index];
        int256 usdAmountDelta;
        int256 feiAmountDelta;

        unchecked {
            // let this value go negative and not revert so that balance can go down if usdAmount is decreased
            usdAmountDelta = usdAmount.toInt256() - updatePCVDeposit.usdAmount.toInt256();
            feiAmountDelta = feiAmount.toInt256() - updatePCVDeposit.feiAmount.toInt256();
        }

        updatePCVDeposit.usdAmount = usdAmount;
        updatePCVDeposit.depositName = depositName;
        updatePCVDeposit.underlyingTokenAmount = underlyingTokenAmount;
        updatePCVDeposit.underlying = underlying;

        uint256 oldBalance = balance;
        uint256 oldFEIBalance = feiReportBalance;

        balance = (balance.toInt256() + usdAmountDelta).toUint256();
        feiReportBalance = (feiReportBalance.toInt256() + feiAmountDelta).toUint256();

        emit BalanceUpdate(oldBalance, balance, oldFEIBalance, feiReportBalance);
    }

    /// @notice function to add a deposit
    function addDeposit(
        uint256 usdAmount,
        uint256 feiAmount,
        uint256 underlyingTokenAmount,
        string calldata depositName,
        address underlying
    ) external onlyGovernorOrAdmin {
        _addDeposit(
            PCVDeposit({
                usdAmount: usdAmount,
                feiAmount: feiAmount,
                underlyingTokenAmount: underlyingTokenAmount,
                depositName: depositName,
                underlying: underlying
            })
        );
    }

    /// @notice function to edit an existing deposit
    function editDeposit(
        uint256 index,
        uint256 usdAmount,
        uint256 feiAmount,
        uint256 underlyingTokenAmount,
        string calldata depositName,
        address underlying
    ) external onlyGovernorOrAdmin {
        _editDeposit(
            index,
            usdAmount,
            feiAmount,
            underlyingTokenAmount,
            depositName,
            underlying
        );
    }

    /// @notice funciont to remove a PCV Deposit
    function removeDeposit(uint256 index) external onlyGovernorOrAdmin {
        _removeDeposit(index);
    }

    // ----------- Getters -----------

    function numDeposits() public view returns (uint256) {
        return pcvDeposits.length;
    }

    /// @notice returns the resistant balance and FEI in the deposit
    function resistantBalanceAndFei() public view override returns (uint256, uint256) {
        return (balance, feiReportBalance);
    }

    /// @notice display the related token of the balance reported
    function balanceReportedIn() public pure override returns (address) {
        return Constants.USD;
    }
    
    /// @notice function to return all of the different tokens deposited into this contract
    function getAllUnderlying() public view returns (address[] memory) {
        uint256 totalDeposits = numDeposits();

        address[] memory allUnderlyingTokens = new address[](totalDeposits);
        for (uint256 i = 0; i < totalDeposits; i++) {
            allUnderlyingTokens[i] = pcvDeposits[i].underlying;
        }

        return allUnderlyingTokens;
    }
}
